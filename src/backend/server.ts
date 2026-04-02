import { createServer } from "node:http";
import { z } from "zod";
import { createRequestId } from "../utils/id";
import { resolveBackendConfig } from "./config/env";
import { checkPostgresHealth, getSingletonPostgresPool } from "./db/PostgresPool";
import { handlePreflight, writeJson } from "./http/json";
import { readApiKeyHeader, readBearerToken, readJsonBody } from "./http/request";
import { PostgresGameRecordRepository } from "./repositories/postgres/PostgresGameRecordRepository";
import { PostgresLeaderboardRepository } from "./repositories/postgres/PostgresLeaderboardRepository";
import { PostgresLobbyRepository } from "./repositories/postgres/PostgresLobbyRepository";
import { PostgresUserRepository } from "./repositories/postgres/PostgresUserRepository";
import { AuthService } from "./services/AuthService";
import { GameService } from "./services/GameService";
import { LeaderboardService } from "./services/LeaderboardService";
import { LobbyService } from "./services/LobbyService";

const RefreshBodySchema = z.object({
  persistentID: z.string().min(1).optional(),
});

const UpsertLobbySchema = z.object({
  gameID: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

const ArchiveGameSchema = z.object({
  status: z.enum(["finished", "in_progress", "archived"]).optional(),
});

const config = resolveBackendConfig();
const pool = getSingletonPostgresPool({
  databaseUrl: config.databaseUrl,
  ssl: config.databaseSsl,
});
const userRepository = new PostgresUserRepository(pool);
const leaderboardRepository = new PostgresLeaderboardRepository(pool);
const gameRecordRepository = new PostgresGameRecordRepository(pool);
const lobbyRepository = new PostgresLobbyRepository(pool);

const authService = new AuthService({
  issuer: config.publicBaseUrl,
  audience: "localhost",
  userRepository,
  leaderboardRepository,
});
const gameService = new GameService(gameRecordRepository);
const leaderboardService = new LeaderboardService(leaderboardRepository);
const lobbyService = new LobbyService(lobbyRepository);
const instanceId = createRequestId().replace("req_", "inst_");

function isAuthorizedByApiKey(requestApiKey: string | null): boolean {
  return requestApiKey !== null && requestApiKey === config.serviceApiKey;
}

function extractGameIdFromPath(pathname: string): string | null {
  const direct = /^\/game\/([^/]+)$/.exec(pathname);
  if (direct) {
    return decodeURIComponent(direct[1]);
  }
  return null;
}

function extractExistsGameIdFromPath(pathname: string): string | null {
  const direct = /^\/api\/game\/([^/]+)\/exists$/.exec(pathname);
  if (direct) {
    return decodeURIComponent(direct[1]);
  }

  const workerScoped = /^\/w\d+\/api\/game\/([^/]+)\/exists$/.exec(pathname);
  if (workerScoped) {
    return decodeURIComponent(workerScoped[1]);
  }

  return null;
}

function extractLobbyDeleteGameId(pathname: string): string | null {
  const match = /^\/api\/lobbies\/([^/]+)$/.exec(pathname);
  if (!match) {
    return null;
  }
  return decodeURIComponent(match[1]);
}

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

  try {
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

    if (request.method === "GET" && pathname === "/api/instance") {
      writeJson(response, 200, { instanceId }, config.corsOrigin);
      return;
    }

    if (request.method === "POST" && pathname === "/auth/refresh") {
      const parsedBody = RefreshBodySchema.safeParse(await readJsonBody(request));
      const headerPersistent =
        request.headers["x-persistent-id"] ??
        request.headers["x-persistentid"] ??
        null;
      const persistentFromHeader = Array.isArray(headerPersistent)
        ? headerPersistent[0] ?? null
        : headerPersistent;
      const persistentID =
        persistentFromHeader ?? (parsedBody.success ? parsedBody.data.persistentID : undefined);

      if (!persistentID) {
        writeJson(response, 401, { error: "persistent_id_required" }, config.corsOrigin);
        return;
      }

      const refreshed = await authService.refreshForPersistentID(persistentID);
      writeJson(response, 200, refreshed, config.corsOrigin);
      return;
    }

    if (
      request.method === "POST" &&
      (pathname === "/auth/logout" || pathname === "/auth/revoke")
    ) {
      writeJson(response, 200, { ok: true }, config.corsOrigin);
      return;
    }

    if (request.method === "POST" && pathname === "/auth/magic-link") {
      writeJson(response, 200, { ok: true }, config.corsOrigin);
      return;
    }

    if (request.method === "GET" && pathname === "/users/@me") {
      const bearer = readBearerToken(request);
      if (!bearer) {
        writeJson(response, 401, { error: "missing_bearer_token" }, config.corsOrigin);
        return;
      }

      const user = await authService.readUserFromToken(bearer);
      if (!user) {
        writeJson(response, 401, { error: "invalid_or_expired_token" }, config.corsOrigin);
        return;
      }

      writeJson(
        response,
        200,
        {
          user: {
            discord: user.discordUsername
              ? {
                  username: user.discordUsername,
                  avatar: null,
                }
              : undefined,
            email: user.email ?? undefined,
          },
          player: {
            id: user.persistentID,
            displayName: user.displayName,
            leaderboard: {
              oneVone: {
                elo: user.elo,
              },
            },
          },
        },
        config.corsOrigin,
      );
      return;
    }

    if (request.method === "GET" && pathname === "/leaderboard/ranked") {
      const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
      const result = await leaderboardService.listRanked(
        Number.isFinite(page) ? page : 1,
      );
      writeJson(response, 200, result, config.corsOrigin);
      return;
    }

    if (request.method === "GET" && pathname === "/public/clans/leaderboard") {
      writeJson(
        response,
        200,
        {
          clans: [],
          page: 1,
          pageCount: 1,
        },
        config.corsOrigin,
      );
      return;
    }

    if (request.method === "GET" && pathname === "/api/lobbies") {
      const lobbies = await lobbyService.listPublicLobbies();
      writeJson(response, 200, lobbies, config.corsOrigin);
      return;
    }

    if (request.method === "POST" && pathname === "/api/lobbies") {
      if (!isAuthorizedByApiKey(readApiKeyHeader(request))) {
        writeJson(response, 401, { error: "invalid_api_key" }, config.corsOrigin);
        return;
      }

      const parsed = UpsertLobbySchema.safeParse(await readJsonBody(request));
      if (!parsed.success) {
        writeJson(
          response,
          400,
          { error: "invalid_lobby_payload", issues: parsed.error.issues },
          config.corsOrigin,
        );
        return;
      }

      await lobbyService.upsertPublicLobby(parsed.data.gameID, parsed.data.payload);
      writeJson(response, 200, { ok: true }, config.corsOrigin);
      return;
    }

    const deleteLobbyId = extractLobbyDeleteGameId(pathname);
    if (request.method === "DELETE" && deleteLobbyId) {
      if (!isAuthorizedByApiKey(readApiKeyHeader(request))) {
        writeJson(response, 401, { error: "invalid_api_key" }, config.corsOrigin);
        return;
      }
      await lobbyService.removePublicLobby(deleteLobbyId);
      writeJson(response, 200, { ok: true }, config.corsOrigin);
      return;
    }

    const existsGameId = extractExistsGameIdFromPath(pathname);
    if (request.method === "GET" && existsGameId) {
      const exists = await gameService.gameExists(existsGameId);
      writeJson(response, 200, { exists }, config.corsOrigin);
      return;
    }

    const gameId = extractGameIdFromPath(pathname);
    if (request.method === "GET" && gameId) {
      const record = await gameService.getGameRecord(gameId);
      if (!record) {
        writeJson(response, 404, { error: "game_not_found" }, config.corsOrigin);
        return;
      }
      writeJson(response, 200, record.payload, config.corsOrigin);
      return;
    }

    if (request.method === "POST" && gameId) {
      if (!isAuthorizedByApiKey(readApiKeyHeader(request))) {
        writeJson(response, 401, { error: "invalid_api_key" }, config.corsOrigin);
        return;
      }

      const body = await readJsonBody(request);
      if (!body || typeof body !== "object") {
        writeJson(response, 400, { error: "invalid_game_payload" }, config.corsOrigin);
        return;
      }

      const archiveMeta = ArchiveGameSchema.safeParse(body);
      await gameService.archiveGameRecord({
        gameID: gameId,
        payload: body as Record<string, unknown>,
        status: archiveMeta.success ? archiveMeta.data.status : undefined,
      });
      writeJson(response, 200, { ok: true }, config.corsOrigin);
      return;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    writeJson(
      response,
      500,
      {
        error: "internal_error",
        message,
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
    `[backend] listening on http://${config.host}:${config.port} (postgres integrated)`,
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
