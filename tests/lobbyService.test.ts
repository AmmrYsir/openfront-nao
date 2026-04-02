import { describe, expect, test } from "bun:test";
import { LobbyService } from "../src/backend/services/LobbyService";
import type { LobbyRepository, PublicLobbyRow } from "../src/backend/repositories/types";

class InMemoryLobbyRepository implements LobbyRepository {
  private readonly rows = new Map<string, PublicLobbyRow>();

  async listPublic(limit: number): Promise<PublicLobbyRow[]> {
    return [...this.rows.values()].slice(0, limit);
  }

  async upsert(gameID: string, payload: Record<string, unknown>): Promise<void> {
    this.rows.set(gameID, {
      gameID,
      payload,
      updatedAt: Date.now(),
    });
  }

  async remove(gameID: string): Promise<void> {
    this.rows.delete(gameID);
  }
}

describe("LobbyService", () => {
  test("upserts and lists public lobbies", async () => {
    const service = new LobbyService(new InMemoryLobbyRepository());
    await service.upsertPublicLobby("GAME-1", { playerCount: 2 });
    const lobbies = await service.listPublicLobbies();
    expect(lobbies.lobbies.length).toBe(1);
    expect(lobbies.lobbies[0]?.gameID).toBe("GAME-1");
  });
});
