import { describe, expect, test } from "bun:test";
import type {
  UserPreferenceRow,
  UserPreferencesRepository,
} from "../src/backend/repositories/types";
import { UserPreferencesService } from "../src/backend/services/UserPreferencesService";

class InMemoryUserPreferencesRepository implements UserPreferencesRepository {
  private readonly entries = new Map<string, UserPreferenceRow>();

  async getByPersistentID(persistentID: string): Promise<UserPreferenceRow | null> {
    return this.entries.get(persistentID) ?? null;
  }

  async upsertByPersistentID(
    persistentID: string,
    input: UserPreferenceRow,
  ): Promise<UserPreferenceRow | null> {
    this.entries.set(persistentID, input);
    return this.entries.get(persistentID) ?? null;
  }
}

describe("UserPreferencesService", () => {
  test("returns default preferences when none exist", async () => {
    const repository = new InMemoryUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    const preferences = await service.getForPersistentID("abc-123");

    expect(preferences.language).toBe("en");
    expect(preferences.username.startsWith("Commander-")).toBe(true);
    expect(preferences.specialEffects).toBe(true);
  });

  test("validates and normalizes preference updates", async () => {
    const repository = new InMemoryUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    const saved = await service.upsertForPersistentID("abc-123", {
      username: "CommanderOne",
      clanTag: "abc",
      language: "EN",
      darkMode: true,
      specialEffects: false,
      anonymousNames: true,
    });

    expect(saved.clanTag).toBe("ABC");
    expect(saved.language).toBe("en");
    expect(saved.darkMode).toBe(true);
  });

  test("rejects invalid username payload", async () => {
    const repository = new InMemoryUserPreferencesRepository();
    const service = new UserPreferencesService(repository);

    await expect(
      service.upsertForPersistentID("abc-123", {
        username: "[]",
        clanTag: "A",
        language: "en",
        darkMode: false,
        specialEffects: true,
        anonymousNames: false,
      }),
    ).rejects.toThrow("invalid_username");
  });
});
