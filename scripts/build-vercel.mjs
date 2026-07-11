import { build } from "esbuild";
import { execSync } from "child_process";

execSync("npx prisma generate", { stdio: "inherit" });

await build({
    entryPoints: ["api/index.ts"],
    outfile: "api/index.js",
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    packages: "external",
    banner: {
        js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
    },
});

console.log("Bundled api/index.js for Vercel");
