import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const classicSourceDir = resolve(root, "classic_source");
const classicDir = resolve(root, "public", "classic");
const classicIndex = resolve(classicDir, "index.html");
const classicAssetsDir = resolve(classicDir, "assets");

if (existsSync(classicSourceDir)) {
  ensureClassicSourceDependencies();
  console.log("classic_source detected. Running legacy test suite...");
  execSync("bun run --cwd classic_source test", {
    cwd: root,
    stdio: "inherit",
  });
  process.exit(0);
}

if (!existsSync(classicIndex) || !existsSync(classicAssetsDir)) {
  console.error(
    "Classic parity validation failed: missing public/classic bundle and classic_source is unavailable.",
  );
  process.exit(1);
}

const assets = readdirSync(classicAssetsDir);
if (assets.length === 0) {
  console.error(
    "Classic parity validation failed: public/classic/assets is empty and classic_source is unavailable.",
  );
  process.exit(1);
}

console.log(
  "classic_source not found. Classic parity bundle is present and can be served from public/classic.",
);

function ensureClassicSourceDependencies() {
  const nodeModulesDir = resolve(classicSourceDir, "node_modules");
  const vitestBin = resolve(nodeModulesDir, ".bin", "vitest");
  const vitestBinCmd = resolve(nodeModulesDir, ".bin", "vitest.cmd");
  if (existsSync(vitestBin) || existsSync(vitestBinCmd)) {
    return;
  }

  console.log("Installing classic_source dependencies...");
  const commands = [
    "bun install --cwd classic_source",
    "npm --prefix classic_source install",
  ];

  for (const command of commands) {
    try {
      execSync(command, {
        cwd: root,
        stdio: "inherit",
      });
      return;
    } catch (error) {
      console.warn(`Dependency install failed (${command}), trying fallback...`);
    }
  }

  throw new Error("Failed to install classic_source dependencies.");
}
