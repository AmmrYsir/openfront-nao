import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const classicRuntimeDir = resolve(root, "packages", "classic-runtime");
const classicRuntimeStaticDir = resolve(classicRuntimeDir, "static");
const classicRuntimeHashedAssetsDir = resolve(classicRuntimeStaticDir, "_assets");
const legacyResourcesDir = resolve(root, "public", "legacy", "resources");
const targetClassicDir = resolve(root, "public", "classic");
const targetClassicIndexPath = resolve(targetClassicDir, "index.html");
const targetHashedAssetsDir = resolve(root, "public", "_assets");
const runtimeGameEnvExpression = `(() => {
        const params = new URLSearchParams(window.location.search);
        const requestedEnv = params.get("classic_env");
        if (requestedEnv === "dev" || requestedEnv === "staging" || requestedEnv === "prod") {
          return requestedEnv;
        }

        const host = window.location.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "::1" ||
          host.endsWith(".local")
        ) {
          return "dev";
        }

        return "prod";
      })()`;

function toPosixPath(pathValue) {
  return pathValue.replace(/\\/g, "/");
}

function encodePathSegments(pathValue) {
  return pathValue
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildLegacyAssetManifest() {
  const entries = {};

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      const rel = toPosixPath(relative(legacyResourcesDir, fullPath));
      entries[rel] = `/legacy/resources/${encodePathSegments(rel)}`;
    }
  }

  walk(legacyResourcesDir);
  return entries;
}

function rewriteClassicAssetPaths(content) {
  return content.replace(/\/(assets|sounds)\//g, (match, segment, offset, source) => {
    const prefix = source.slice(0, offset);
    if (prefix.endsWith("/classic") || prefix.endsWith("/legacy/resources")) {
      return match;
    }
    return `/classic/${segment}/`;
  });
}

function replaceTemplatePlaceholders(indexHtml, assetManifestJson) {
  let html = indexHtml;
  html = html.replaceAll("<%- manifestHref %>", "/legacy/resources/manifest.json");
  html = html.replaceAll(
    "<%- faviconHref %>",
    "/legacy/resources/images/Favicon.svg",
  );
  html = html.replaceAll(
    "<%- gameplayScreenshotUrl %>",
    "/legacy/resources/images/GameplayScreenshot.png",
  );
  html = html.replaceAll("<%- gitCommit %>", JSON.stringify("LEGACY-COMPAT"));
  html = html.replaceAll("<%- assetManifest %>", assetManifestJson);
  html = html.replaceAll("<%- gameEnv %>", runtimeGameEnvExpression);
  html = html.replaceAll(
    "<%- backgroundImageUrl %>",
    "/legacy/resources/images/background.webp",
  );
  html = html.replaceAll(
    "<%- desktopLogoImageUrl %>",
    "/legacy/resources/images/OpenFront.webp",
  );
  html = html.replaceAll(
    "<%- mobileLogoImageUrl %>",
    "/legacy/resources/images/OF.webp",
  );
  return html;
}

function runLegacyBuild() {
  ensureClassicRuntimeDependencies();

  const commands = [
    "bun run --cwd packages/classic-runtime build-prod",
    "npm --prefix packages/classic-runtime run build-prod",
  ];

  for (const command of commands) {
    try {
      execSync(command, {
        cwd: root,
        stdio: "inherit",
      });
      return;
    } catch (error) {
      console.warn(`Legacy build command failed (${command}), trying fallback...`);
    }
  }

  throw new Error("Failed to build classic runtime with bun and npm fallbacks.");
}

function ensureClassicRuntimeDependencies() {
  const nodeModulesDir = resolve(classicRuntimeDir, "node_modules");
  const concurrentlyBin = resolve(nodeModulesDir, ".bin", "concurrently");
  const concurrentlyBinCmd = resolve(nodeModulesDir, ".bin", "concurrently.cmd");
  if (existsSync(concurrentlyBin) || existsSync(concurrentlyBinCmd)) {
    return;
  }

  console.log("Installing classic runtime dependencies...");
  const commands = [
    "bun install --cwd packages/classic-runtime",
    "npm --prefix packages/classic-runtime install",
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

  throw new Error("Failed to install classic runtime dependencies.");
}

function rewriteTextFilesRecursively(startDir) {
  const stack = [startDir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const ext = entry.name.toLowerCase();
      const isText =
        ext.endsWith(".js") ||
        ext.endsWith(".mjs") ||
        ext.endsWith(".css") ||
        ext.endsWith(".html");
      if (!isText) {
        continue;
      }

      const original = readFileSync(fullPath, "utf8");
      const rewritten = rewriteClassicAssetPaths(original);
      if (rewritten !== original) {
        writeFileSync(fullPath, rewritten, "utf8");
      }
    }
  }
}

if (!existsSync(legacyResourcesDir)) {
  console.error("Missing public/legacy/resources. Cannot build classic compatibility bundle.");
  process.exit(1);
}

if (!existsSync(classicRuntimeDir)) {
  if (existsSync(targetClassicIndexPath)) {
    console.log("packages/classic-runtime not found. Using existing committed classic bundle.");
    process.exit(0);
  }
  console.error(
    "Missing packages/classic-runtime directory and no committed public/classic bundle found.",
  );
  process.exit(1);
}

console.log("Building classic runtime production bundle...");
runLegacyBuild();

if (!existsSync(classicRuntimeStaticDir)) {
  console.error("Expected packages/classic-runtime/static after build.");
  process.exit(1);
}

if (existsSync(targetClassicDir)) {
  rmSync(targetClassicDir, { recursive: true, force: true });
}
mkdirSync(targetClassicDir, { recursive: true });

if (existsSync(targetHashedAssetsDir)) {
  rmSync(targetHashedAssetsDir, { recursive: true, force: true });
}

const sourceAssetsDir = resolve(classicRuntimeStaticDir, "assets");
const sourceSoundsDir = resolve(classicRuntimeStaticDir, "sounds");
if (!existsSync(sourceAssetsDir)) {
  console.error("Missing packages/classic-runtime/static/assets. Build output is incomplete.");
  process.exit(1);
}
if (!existsSync(classicRuntimeHashedAssetsDir)) {
  console.error("Missing packages/classic-runtime/static/_assets. Build output is incomplete.");
  process.exit(1);
}
cpSync(sourceAssetsDir, resolve(targetClassicDir, "assets"), { recursive: true });
if (existsSync(sourceSoundsDir)) {
  cpSync(sourceSoundsDir, resolve(targetClassicDir, "sounds"), { recursive: true });
}
cpSync(classicRuntimeHashedAssetsDir, targetHashedAssetsDir, { recursive: true });

const sourceIndexPath = resolve(classicRuntimeStaticDir, "index.html");
if (!existsSync(sourceIndexPath)) {
  console.error("Missing packages/classic-runtime/static/index.html.");
  process.exit(1);
}

const manifest = buildLegacyAssetManifest();
const manifestJson = JSON.stringify(manifest);
const sourceIndex = readFileSync(sourceIndexPath, "utf8");
const patchedIndex = replaceTemplatePlaceholders(sourceIndex, manifestJson);

writeFileSync(targetClassicIndexPath, patchedIndex, "utf8");

rewriteTextFilesRecursively(targetClassicDir);

const targetAssetsBytes = readdirSync(resolve(targetClassicDir, "assets"))
  .map((name) => statSync(resolve(targetClassicDir, "assets", name)).size)
  .reduce((sum, value) => sum + value, 0);

console.log("Classic compatibility bundle generated.");
console.log(`- index: ${targetClassicIndexPath}`);
console.log(`- assets bytes: ${targetAssetsBytes}`);
