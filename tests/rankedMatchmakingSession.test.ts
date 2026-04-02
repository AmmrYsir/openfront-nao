import { describe, expect, test } from "bun:test";
import { RankedMatchmakingSession } from "../src/client/matchmaking/RankedMatchmakingSession";

const runtimeConfig = {
  numWorkers: () => 1,
  workerPath: () => "/w0",
  jwtIssuer: () => "http://localhost:8787",
};

const authClient = {
  getPlayToken: async () => "token-1",
};

describe("RankedMatchmakingSession", () => {
  test("starts, receives assignment, and emits ready callback", async () => {
    let assignedListener: ((gameID: string) => void) | null = null;
    const statuses: string[] = [];
    const readyGames: string[] = [];

    const session = new RankedMatchmakingSession({
      config: runtimeConfig,
      authClient,
      pollIntervalMs: 5,
      onStatus: (status) => statuses.push(status),
      onReady: (gameID) => readyGames.push(gameID),
      matchmakingClientFactory: (options) => {
        assignedListener = options.onGameAssigned;
        return {
          open: async () => {},
          close: () => {},
          pollGameReady: async () => true,
        };
      },
    });

    await session.start();
    assignedListener?.("GAME-123");

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(readyGames).toEqual(["GAME-123"]);
    expect(statuses.some((status) => status.includes("Queued"))).toBe(true);

    session.stop();
  });

  test("stops session and closes underlying client", async () => {
    let closeCalled = false;

    const session = new RankedMatchmakingSession({
      config: runtimeConfig,
      authClient,
      matchmakingClientFactory: () => ({
        open: async () => {},
        close: () => {
          closeCalled = true;
        },
        pollGameReady: async () => false,
      }),
    });

    await session.start();
    session.stop();

    expect(closeCalled).toBe(true);
  });
});
