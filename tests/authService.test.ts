import { describe, expect, test } from "bun:test";
import { AuthService } from "../src/backend/services/AuthService";
import type {
  LeaderboardRepository,
  UserRepository,
  UserSummary,
  RankedPlayerRow,
} from "../src/backend/repositories/types";

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserSummary>();

  async getByPersistentID(persistentID: string): Promise<UserSummary | null> {
    return this.users.get(persistentID) ?? null;
  }

  async upsertByPersistentID(input: {
    persistentID: string;
    displayName: string;
    email?: string | null;
    discordUsername?: string | null;
  }): Promise<UserSummary> {
    const existing = this.users.get(input.persistentID);
    const next: UserSummary = {
      id: existing?.id ?? `u_${input.persistentID}`,
      displayName: input.displayName,
      email: input.email ?? null,
      discordUsername: input.discordUsername ?? null,
    };
    this.users.set(input.persistentID, next);
    return next;
  }
}

class InMemoryLeaderboardRepository implements LeaderboardRepository {
  private readonly rows = new Map<string, RankedPlayerRow>();

  async listRanked(
    page: number,
    _pageSize: number,
  ): Promise<{ page: number; pageCount: number; players: RankedPlayerRow[] }> {
    return {
      page,
      pageCount: 1,
      players: [...this.rows.values()],
    };
  }

  async getByPersistentID(persistentID: string): Promise<RankedPlayerRow | null> {
    return this.rows.get(persistentID) ?? null;
  }
}

describe("AuthService", () => {
  test("issues and validates unsigned jwt refresh token", async () => {
    const authService = new AuthService({
      issuer: "http://localhost:8787",
      audience: "localhost",
      userRepository: new InMemoryUserRepository(),
      leaderboardRepository: new InMemoryLeaderboardRepository(),
    });

    const refreshed = await authService.refreshForPersistentID("persist-user-1");
    expect(typeof refreshed.jwt).toBe("string");
    expect(refreshed.expiresIn).toBeGreaterThan(0);

    const profile = await authService.readUserFromToken(refreshed.jwt);
    expect(profile).toBeTruthy();
    expect(profile?.persistentID).toBe("persist-user-1");
    expect(profile?.elo).toBe(1000);
  });
});
