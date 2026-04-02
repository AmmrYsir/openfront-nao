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

function safeCount(path, extension) {
  return existsSync(path) ? countFiles(path, extension) : 0;
}

const oldSrcTs = folderCount(resolve(repoRoot, "classic_source", "src"));
const newSrcTs = folderCount(resolve(repoRoot, "src"));
const oldTests = safeCount(resolve(repoRoot, "classic_source", "tests"), ".test.ts");
const newTests = safeCount(resolve(repoRoot, "tests"), ".test.ts");

const parityChecks = [
  {
    capability: "Singleplayer Modal",
    oldPath: "classic_source/src/client/SinglePlayerModal.ts",
    newPath: "src/ui/pages/SinglePlayerModal.ts",
    bridgePaths: ["src/ui/pages/ClassicPageController.ts", "public/classic/index.html"],
  },
  {
    capability: "Game Mode Selector",
    oldPath: "classic_source/src/client/GameModeSelector.ts",
    newPath: "src/ui/pages/GameModeSelector.ts",
    bridgePaths: ["src/ui/pages/ClassicPageController.ts", "public/classic/index.html"],
  },
  {
    capability: "Local Solo Server Flow",
    oldPath: "classic_source/src/client/LocalServer.ts",
    newPath: "src/client/solo/LocalServer.ts",
    bridgePaths: ["src/ui/pages/ClassicPageController.ts", "public/classic/index.html"],
  },
  {
    capability: "Canvas Renderer",
    oldPath: "classic_source/src/client/graphics/GameRenderer.ts",
    newPath: "src/ui/runtime/GameRenderer.ts",
    bridgePaths: ["src/ui/pages/ClassicPageController.ts", "public/classic/index.html"],
  },
  {
    capability: "Client Game Runner",
    oldPath: "classic_source/src/client/ClientGameRunner.ts",
    newPath: "src/ui/runtime/ClientGameRunner.ts",
    bridgePaths: ["src/ui/pages/ClassicPageController.ts", "public/classic/index.html"],
  },
  {
    capability: "Classic UI Bridge",
    oldPath: "classic_source/static/index.html",
    newPath: "src/ui/pages/ClassicPageController.ts",
    bridgePaths: ["public/classic/index.html"],
  },
];

const parityReport = parityChecks.map((check) => {
  const oldExists = existsSync(resolve(repoRoot, check.oldPath));
  const newExists = existsSync(resolve(repoRoot, check.newPath));
  const bridgeExists = (check.bridgePaths ?? []).every((path) =>
    existsSync(resolve(repoRoot, path)),
  );
  let status = "not_applicable";
  if (oldExists && newExists) {
    status = "ported";
  } else if (oldExists && bridgeExists) {
    status = "bridged_via_classic";
  } else if (oldExists) {
    status = "missing_in_new";
  }
  return {
    ...check,
    oldExists,
    newExists,
    bridgeExists,
    status,
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
