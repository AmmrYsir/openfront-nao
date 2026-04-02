import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const oldProjectDir = resolve(root, "old_project");
const classicDir = resolve(root, "public", "classic");
const classicIndex = resolve(classicDir, "index.html");
const classicAssetsDir = resolve(classicDir, "assets");

if (existsSync(oldProjectDir)) {
  console.log("old_project detected. Running legacy test suite...");
  execSync("npm --prefix old_project test", {
    cwd: root,
    stdio: "inherit",
  });
  process.exit(0);
}

if (!existsSync(classicIndex) || !existsSync(classicAssetsDir)) {
  console.error(
    "Classic parity validation failed: missing public/classic bundle and old_project is unavailable.",
  );
  process.exit(1);
}

const assets = readdirSync(classicAssetsDir);
if (assets.length === 0) {
  console.error(
    "Classic parity validation failed: public/classic/assets is empty and old_project is unavailable.",
  );
  process.exit(1);
}

console.log(
  "old_project not found. Classic parity bundle is present and can be served from public/classic.",
);
