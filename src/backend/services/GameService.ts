import type { GameRecordEnvelope, GameRecordRepository } from "../repositories/types";

export class GameService {
  private readonly gameRecords: GameRecordRepository;

  constructor(gameRecords: GameRecordRepository) {
    this.gameRecords = gameRecords;
  }

  async archiveGameRecord(input: {
    gameID: string;
    payload: Record<string, unknown>;
    status?: "finished" | "in_progress" | "archived";
  }): Promise<void> {
    const status = input.status ?? "finished";
    const envelope: GameRecordEnvelope = {
      gameID: input.gameID,
      payload: input.payload,
      status,
    };
    await this.gameRecords.upsert(envelope);
  }

  async getGameRecord(gameID: string): Promise<GameRecordEnvelope | null> {
    return this.gameRecords.getByGameID(gameID);
  }

  async gameExists(gameID: string): Promise<boolean> {
    return this.gameRecords.exists(gameID);
  }
}
