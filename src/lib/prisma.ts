import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const basePrisma = new PrismaClient({ adapter });

// ── Serverless cold-start resilience ──────────────────────────────────────
// On Vercel, the first invocation after a cold start reaches the pooled
// `pooled.db.prisma.io` endpoint before the connection is fully warm. The
// batch `$transaction([...])` calls our list endpoints use then intermittently
// fail with Prisma error P2028 ("Transaction API error"). Once the pool is
// warm every subsequent request succeeds, so a single transparent retry on
// the transient connection errors is enough to hide the cold hit from clients.

// Codes that mean "the connection hiccupped, try again", not "your data/query
// is wrong". We only retry these — a real constraint or validation error must
// still surface immediately.
const TRANSIENT_PRISMA_CODES = new Set(["P2028", "P2024", "P1001", "P1002", "P1008", "P1017"]);

const isTransient = (error: unknown): boolean => {
    const code = (error as { code?: string })?.code;
    if (code && TRANSIENT_PRISMA_CODES.has(code)) return true;
    // The pg driver sometimes throws a raw connection error with no Prisma code.
    const message = (error as { message?: string })?.message ?? "";
    return /connection|terminated|timeout|ECONNRESET|reset by peer/i.test(message);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(run: () => Promise<T>, attempts = 3): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await run();
        } catch (error) {
            lastError = error;
            if (attempt === attempts || !isTransient(error)) throw error;
            // Short, escalating backoff so the pool has a moment to establish.
            await sleep(attempt * 100);
        }
    }
    throw lastError;
};

// `$transaction` is where P2028 surfaces, so we wrap it. Both the array form
// (`$transaction([...])`) and the callback form (`$transaction(async (tx) => ...)`)
// route through the same retry, preserving the original overloaded signature.
const originalTransaction = basePrisma.$transaction.bind(basePrisma);

const prisma = new Proxy(basePrisma, {
    get(target, prop, receiver) {
        if (prop === "$transaction") {
            return (...args: unknown[]) =>
                withRetry(() => (originalTransaction as (...a: unknown[]) => Promise<unknown>)(...args));
        }
        return Reflect.get(target, prop, receiver);
    },
}) as typeof basePrisma;

export { prisma };
