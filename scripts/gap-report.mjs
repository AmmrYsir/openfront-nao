import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();

function countFiles(dir, extension) {
  let total = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      total += countFiles(fullPath, extension);
      continue;
    }
    if (!extension || fullPath.endsWith(extension)) {
      total += 1;
    }
  }
  return total;
}

function folderCount(path) {
  return existsSync(path) ? countFiles(path, ".ts") : 0;
}

const oldSrcTs = folderCount(resolve(repoRoot, "old_project", "src"));
const newSrcTs = folderCount(resolve(repoRoot, "src"));
const oldTests = countFiles(resolve(repoRoot, "old_project", "tests"), ".test.ts");
const newTests = countFiles(resolve(repoRoot, "tests"), ".test.ts");

const parityChecks = [
  {
    capability: "Singleplayer Modal",
    oldPath: "old_project/src/client/SinglePlayerModal.ts",
    newPath: "src/ui/pages/SinglePlayerModal.ts",
  },
  {
    capability: "Game Mode Selector",
    oldPath: "old_project/src/client/GameModeSelector.ts",
    newPath: "src/ui/pages/GameModeSelector.ts",
  },
  {
    capability: "Local Solo Server Flow",
    oldPath: "old_project/src/client/LocalServer.ts",
    newPath: "src/client/solo/LocalServer.ts",
  },
  {
    capability: "Canvas Renderer",
    oldPath: "old_project/src/client/graphics/GameRenderer.ts",
    newPath: "src/ui/runtime/GameRenderer.ts",
  },
  {
    capability: "Client Game Runner",
    oldPath: "old_project/src/client/ClientGameRunner.ts",
    newPath: "src/ui/runtime/ClientGameRunner.ts",
  },
];

const parityReport = parityChecks.map((check) => {
  const oldExists = existsSync(resolve(repoRoot, check.oldPath));
  const newExists = existsSync(resolve(repoRoot, check.newPath));
  return {
    ...check,
    oldExists,
    newExists,
    status: oldExists && newExists ? "ported" : oldExists ? "missing_in_new" : "not_applicable",
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    oldSrcTs,
    newSrcTs,
    oldTests,
    newTests,
  },
  parityReport,
};

const reportPath = resolve(repoRoot, "docs", "gap-report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log("OpenFront migration gap report");
console.log(`- old src .ts files: ${oldSrcTs}`);
console.log(`- new src .ts files: ${newSrcTs}`);
console.log(`- old tests: ${oldTests}`);
console.log(`- new tests: ${newTests}`);
console.log("- key parity checks:");
for (const row of parityReport) {
  console.log(`  - ${row.capability}: ${row.status}`);
}
console.log(`Report written to ${reportPath}`);
