import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = process.cwd();
const envPath = resolve(repoRoot, ".env");
const strictMode = process.argv.includes("--strict");

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const output = {};

  for (const rawLine of content.split(/\r?\n/g)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    output[key] = value;
  }

  return output;
}

function readValue(key, parsedEnv) {
  if (parsedEnv[key] && parsedEnv[key].length > 0) {
    return parsedEnv[key];
  }
  const processValue = process.env[key];
  if (processValue && processValue.length > 0) {
    return processValue;
  }
  return null;
}

const parsedEnv = existsSync(envPath) ? parseEnvFile(envPath) : {};

const requiredKeys = ["API_KEY", "DATABASE_URL", "API_PUBLIC_BASE"];
const missingRequired = requiredKeys.filter((key) => readValue(key, parsedEnv) === null);

if (missingRequired.length > 0) {
  const message = `Missing required env keys: ${missingRequired.join(", ")}`;
  if (strictMode) {
    console.error(message);
    process.exit(1);
  }
  console.warn(`${message}. Using runtime defaults where available.`);
}

const apiPort = readValue("API_PORT", parsedEnv);
if (apiPort !== null && Number.isNaN(Number.parseInt(apiPort, 10))) {
  console.error("API_PORT must be an integer.");
  process.exit(1);
}

const databaseUrl = readValue("DATABASE_URL", parsedEnv);
if (databaseUrl !== null && !databaseUrl.startsWith("postgres://")) {
  console.error("DATABASE_URL should start with postgres://");
  process.exit(1);
}

console.log("Environment validation passed.");
