export interface BackendConfig {
  host: string;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  databaseSsl: boolean;
  serviceApiKey: string;
}

function readEnvValue(key: string): string | undefined {
  const bunEnv = (
    globalThis as unknown as {
      Bun?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).Bun?.env?.[key];
  if (typeof bunEnv === "string" && bunEnv.length > 0) {
    return bunEnv;
  }

  const processEnv = (
    globalThis as unknown as {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env?.[key];
  if (typeof processEnv === "string" && processEnv.length > 0) {
    return processEnv;
  }

  return undefined;
}

function readNumberEnv(key: string, fallback: number): number {
  const raw = readEnvValue(key);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function readBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = readEnvValue(key);
  if (!raw) {
    return fallback;
  }

  const lowered = raw.toLowerCase();
  if (lowered === "1" || lowered === "true" || lowered === "yes") {
    return true;
  }
  if (lowered === "0" || lowered === "false" || lowered === "no") {
    return false;
  }
  return fallback;
}

export function resolveBackendConfig(): BackendConfig {
  return {
    host: readEnvValue("API_HOST") ?? "0.0.0.0",
    port: readNumberEnv("API_PORT", 8787),
    corsOrigin: readEnvValue("API_CORS_ORIGIN") ?? "*",
    databaseUrl:
      readEnvValue("DATABASE_URL") ??
      "postgres://postgres:postgres@localhost:5432/openfront_nao",
    databaseSsl: readBooleanEnv("DATABASE_SSL", false),
    serviceApiKey: readEnvValue("API_KEY") ?? "dev-api-key",
  };
}
