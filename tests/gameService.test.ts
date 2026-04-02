import { describe, expect, test } from "bun:test";
import { GameService } from "../src/backend/services/GameService";
import type { GameRecordEnvelope, GameRecordRepository } from "../src/backend/repositories/types";

class InMemoryGameRecordRepository implements GameRecordRepository {
  private readonly records = new Map<string, GameRecordEnvelope>();

  async getByGameID(gameID: string): Promise<GameRecordEnvelope | null> {
    return this.records.get(gameID) ?? null;
  }

  async upsert(record: GameRecordEnvelope): Promise<void> {
    this.records.set(record.gameID, record);
  }

  async exists(gameID: string): Promise<boolean> {
    return this.records.has(gameID);
  }
}

describe("GameService", () => {
  test("archives and resolves game existence", async () => {
    const repo = new InMemoryGameRecordRepository();
    const service = new GameService(repo);

    await service.archiveGameRecord({
      gameID: "GAME-XYZ",
      payload: { turns: [] },
      status: "finished",
    });

    expect(await service.gameExists("GAME-XYZ")).toBe(true);
    const record = await service.getGameRecord("GAME-XYZ");
    expect(record?.status).toBe("finished");
  });
});
