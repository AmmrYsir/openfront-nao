import { describe, expect, test } from "bun:test";
import { LocalGameHistoryStore } from "../src/client/history/LocalGameHistoryStore";
import { LocalServer, normalizeSoloConfig } from "../src/client/solo/LocalServer";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("LocalServer", () => {
  test("normalizes out-of-range solo config values", () => {
    const config = normalizeSoloConfig({
      mapId: "   ",
      mapSize: "bad" as "normal",
      bots: 999,
      mode: "bad" as "ffa",
      teamCount: 9 as 2,
    });

    expect(config.mapId).toBe("World");
    expect(config.mapSize).toBe("normal");
    expect(config.bots).toBe(400);
    expect(config.mode).toBe("ffa");
    expect(config.teamCount).toBe(4);
  });

  test("creates session and records it in local history", () => {
    const storage = new MemoryStorage();
    const history = new LocalGameHistoryStore(storage);
    const localServer = new LocalServer({
      historyStore: history,
      storage,
      now: () => 1700000000000,
    });

    const session = localServer.createSession({
      mapId: "Europe",
      mapSize: "compact",
      bots: 120,
      mode: "team",
      teamCount: 3,
    });

    expect(session.gameID.startsWith("SOLO-")).toBe(true);
    expect(session.createdAt).toBe(1700000000000);
    expect(session.config.mapId).toBe("Europe");
    expect(session.config.mapSize).toBe("compact");
    expect(session.config.mode).toBe("team");
    expect(session.config.teamCount).toBe(3);

    const entries = history.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.gameID).toBe(session.gameID);
    expect(entries[0]?.lobbyConfig).toMatchObject({
      mode: "solo",
      gameType: "singleplayer",
    });

    const saved = localServer.readLastConfig();
    expect(saved?.mapId).toBe("Europe");
  });

  test("builds runtime search params from solo config", () => {
    const localServer = new LocalServer({
      storage: new MemoryStorage(),
    });

    const compactSearch = localServer.buildRuntimeSearch("?foo=1", {
      mapId: "Asia",
      mapSize: "compact",
      bots: 40,
      mode: "ffa",
      teamCount: 2,
    });
    expect(compactSearch).toContain("foo=1");
    expect(compactSearch).toContain("map=Asia");
    expect(compactSearch).toContain("compact=1");
    expect(localServer.requiresRuntimeReload("?foo=1", {
      mapId: "Asia",
      mapSize: "compact",
      bots: 40,
      mode: "ffa",
      teamCount: 2,
    })).toBe(true);

    const normalSearch = localServer.buildRuntimeSearch("?map=Asia&compact=1", {
      mapId: "Asia",
      mapSize: "normal",
      bots: 40,
      mode: "ffa",
      teamCount: 2,
    });
    expect(normalSearch).toBe("?map=Asia");
  });
});
