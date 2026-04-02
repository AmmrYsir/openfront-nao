import { describe, expect, test } from "bun:test";
import { LocalGameHistoryStore } from "../src/client/history/LocalGameHistoryStore";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("LocalGameHistoryStore", () => {
  test("records lobby starts and game completion entries", () => {
    const storage = new MemoryStorage();
    const store = new LocalGameHistoryStore(storage);

    store.recordLobbyStart("GAME-1", { mode: "solo" });
    store.recordGameEnd("GAME-1", { winner: "A" });

    const entries = store.list();

    expect(entries).toHaveLength(1);
    expect(entries[0]?.gameID).toBe("GAME-1");
    expect(entries[0]?.gameRecord).toEqual({ winner: "A" });
  });

  test("ignores game completion if start entry does not exist", () => {
    const storage = new MemoryStorage();
    const store = new LocalGameHistoryStore(storage);

    store.recordGameEnd("UNKNOWN", { winner: "X" });

    expect(store.list()).toHaveLength(0);
  });
});
