import { describe, expect, test } from "bun:test";
import {
  UserPreferencesStore,
  buildAnonymousUsername,
} from "../src/client/settings/UserPreferencesStore";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("UserPreferencesStore", () => {
  test("buildAnonymousUsername is deterministic per seed", () => {
    expect(buildAnonymousUsername("seed-1")).toBe(buildAnonymousUsername("seed-1"));
    expect(buildAnonymousUsername("seed-1")).not.toBe(buildAnonymousUsername("seed-2"));
  });

  test("loads defaults and persists valid identity updates", () => {
    const storage = new MemoryStorage();
    const store = new UserPreferencesStore(storage);

    const initial = store.getSnapshot();
    expect(initial.username.startsWith("Anon")).toBe(true);

    const updated = store.updateIdentity({
      username: "CommanderOne",
      clanTag: "abc",
    });

    expect(updated.ok).toBe(true);
    expect(store.getSnapshot().clanTag).toBe("ABC");
    expect(storage.getItem("username")).toBe("CommanderOne");
    expect(storage.getItem("clanTag")).toBe("ABC");
  });

  test("rejects invalid identity values", () => {
    const storage = new MemoryStorage();
    const store = new UserPreferencesStore(storage);

    const invalid = store.updateIdentity({
      username: "[]",
      clanTag: "TOOLONG",
    });

    expect(invalid.ok).toBe(false);
  });
});
