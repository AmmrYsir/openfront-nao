import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const source = resolve(repoRoot, ".env.example");
const target = resolve(repoRoot, ".env");

if (!existsSync(source)) {
  console.error("Missing .env.example. Cannot initialize .env.");
  process.exit(1);
}

if (existsSync(target)) {
  console.log(".env already exists. Skipping initialization.");
  process.exit(0);
}

copyFileSync(source, target);
console.log("Initialized .env from .env.example.");
