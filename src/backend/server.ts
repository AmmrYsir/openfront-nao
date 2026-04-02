import { createServer } from "node:http";
import { resolveBackendConfig } from "./config/env";
import { checkPostgresHealth, getSingletonPostgresPool } from "./db/PostgresPool";
import { handlePreflight, writeJson } from "./http/json";

const config = resolveBackendConfig();
const pool = getSingletonPostgresPool({
  databaseUrl: config.databaseUrl,
  ssl: config.databaseSsl,
});

const server = createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 400, { error: "missing_url" }, config.corsOrigin);
    return;
  }

  if (request.method === "OPTIONS") {
    handlePreflight(response, config.corsOrigin);
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const pathname = url.pathname;

  if (request.method === "GET" && pathname === "/api/health") {
    writeJson(
      response,
      200,
      {
        ok: true,
        service: "openfront-nao-backend",
        timestamp: Date.now(),
      },
      config.corsOrigin,
    );
    return;
  }

  if (request.method === "GET" && pathname === "/api/health/db") {
    const ok = await checkPostgresHealth(pool);
    writeJson(
      response,
      ok ? 200 : 503,
      {
        ok,
        service: "postgres",
      },
      config.corsOrigin,
    );
    return;
  }

  writeJson(
    response,
    404,
    {
      error: "not_found",
      path: pathname,
    },
    config.corsOrigin,
  );
});

server.listen(config.port, config.host, () => {
  console.log(
    `[backend] listening on http://${config.host}:${config.port} (db configured)`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void (async () => {
      try {
        await pool.end();
      } finally {
        server.close(() => process.exit(0));
      }
    })();
  });
}
