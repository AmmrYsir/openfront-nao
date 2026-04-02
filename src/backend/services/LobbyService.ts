import type { LobbyRepository } from "../repositories/types";

export class LobbyService {
  private readonly lobbies: LobbyRepository;

  constructor(lobbies: LobbyRepository) {
    this.lobbies = lobbies;
  }

  async listPublicLobbies(): Promise<{
    lobbies: Array<{
      gameID: string;
      updatedAt: number;
      payload: Record<string, unknown>;
    }>;
  }> {
    const rows = await this.lobbies.listPublic(200);
    return {
      lobbies: rows.map((row) => ({
        gameID: row.gameID,
        updatedAt: row.updatedAt,
        payload: row.payload,
      })),
    };
  }

  async upsertPublicLobby(
    gameID: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.lobbies.upsert(gameID, payload);
  }

  async removePublicLobby(gameID: string): Promise<void> {
    await this.lobbies.remove(gameID);
  }
}
