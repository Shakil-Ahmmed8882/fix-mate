// Prisma 7's TS-first generator (`provider = "prisma-client"`) emits relative
// imports without file extensions (e.g. `from "./enums"`), which strict Node
// ESM resolution rejects at runtime with ERR_MODULE_NOT_FOUND. This patches
// every generated file to add `.js` extensions, matching what we did by hand
// for our own src/ imports. Runs after every `prisma generate`.
import fs from "fs";
import path from "path";

const GENERATED_DIR = path.resolve("generated/prisma");

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (entry.name.endsWith(".ts")) {
            patchFile(fullPath);
        }
    }
}

function patchFile(filePath) {
    const original = fs.readFileSync(filePath, "utf8");
    const patched = original.replace(
        /from\s+(["'])(\.[^"']+)\1/g,
        (match, quote, importPath) => {
            if (importPath.endsWith(".js") || importPath.endsWith(".json")) return match;
            const dir = path.dirname(filePath);
            const resolved = path.resolve(dir, importPath);
            // A sibling `X.ts` file wins over an `X/` directory of the same name
            // (TypeScript/Prisma resolve the file first), so only treat it as a
            // directory import when there is no matching `.ts` file.
            const fileExists = fs.existsSync(`${resolved}.ts`);
            const isDir = !fileExists && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
            const newPath = isDir ? `${importPath}/index.js` : `${importPath}.js`;
            return `from ${quote}${newPath}${quote}`;
        }
    );
    if (patched !== original) {
        fs.writeFileSync(filePath, patched);
    }
}

if (fs.existsSync(GENERATED_DIR)) {
    walk(GENERATED_DIR);
    console.log("Patched generated Prisma client imports for ESM.");
}
