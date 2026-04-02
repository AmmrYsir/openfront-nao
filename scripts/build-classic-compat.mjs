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
const oldProjectDir = resolve(root, "old_project");
const oldStaticDir = resolve(oldProjectDir, "static");
const legacyResourcesDir = resolve(root, "public", "legacy", "resources");
const targetClassicDir = resolve(root, "public", "classic");
const targetClassicIndexPath = resolve(targetClassicDir, "index.html");

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
  html = html.replaceAll("<%- gameEnv %>", JSON.stringify("prod"));
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

if (!existsSync(oldProjectDir)) {
  if (existsSync(targetClassicIndexPath)) {
    console.log("old_project not found. Using existing committed classic bundle.");
    process.exit(0);
  }
  console.error(
    "Missing old_project directory and no committed public/classic bundle found.",
  );
  process.exit(1);
}

console.log("Building old project production bundle...");
execSync("npm --prefix old_project run build-prod", {
  cwd: root,
  stdio: "inherit",
});

if (!existsSync(oldStaticDir)) {
  console.error("Expected old_project/static after build.");
  process.exit(1);
}

if (existsSync(targetClassicDir)) {
  rmSync(targetClassicDir, { recursive: true, force: true });
}
mkdirSync(targetClassicDir, { recursive: true });

const sourceAssetsDir = resolve(oldStaticDir, "assets");
const sourceSoundsDir = resolve(oldStaticDir, "sounds");
if (!existsSync(sourceAssetsDir)) {
  console.error("Missing old_project/static/assets. Build output is incomplete.");
  process.exit(1);
}
cpSync(sourceAssetsDir, resolve(targetClassicDir, "assets"), { recursive: true });
if (existsSync(sourceSoundsDir)) {
  cpSync(sourceSoundsDir, resolve(targetClassicDir, "sounds"), { recursive: true });
}

const sourceIndexPath = resolve(oldStaticDir, "index.html");
if (!existsSync(sourceIndexPath)) {
  console.error("Missing old_project/static/index.html.");
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
