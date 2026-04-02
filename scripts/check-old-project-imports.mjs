import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const srcRoot = join(root, "src");
const blockedPattern = /old_project/;
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".json"]);

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (![...allowedExtensions].some((extension) => fullPath.endsWith(extension))) {
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

const offenders = [];
for (const filePath of walk(srcRoot)) {
  const content = readFileSync(filePath, "utf8");
  if (blockedPattern.test(content)) {
    offenders.push(filePath);
  }
}

if (offenders.length > 0) {
  console.error("Found forbidden old_project references in source files:");
  for (const filePath of offenders) {
    console.error(` - ${filePath}`);
  }
  process.exit(1);
}

console.log("No old_project references found in src/.");
