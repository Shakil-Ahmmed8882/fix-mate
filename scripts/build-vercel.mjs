import { build } from "esbuild";
import { execSync } from "child_process";

execSync("npx prisma generate", { stdio: "inherit" });

await build({
    entryPoints: ["api/_entry.ts"],
    outfile: "api/index.js",
    allowOverwrite: true,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    packages: "external",
    external: [
        "express",
        "cors",
        "cookie-parser",
        "jsonwebtoken",
        "bcryptjs",
        "stripe",
        "http-status",
        "pg",
        "@prisma/adapter-pg",
        "@prisma/client",
    ],
    banner: {
        js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
    },
});

console.log("Bundled api/index.js for Vercel");
