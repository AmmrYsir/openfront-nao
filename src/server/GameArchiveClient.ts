import { z } from "zod";

const GameRecordSchema = z.object({
  info: z.object({
    gameID: z.string(),
  }),
});

export type GameRecord = z.infer<typeof GameRecordSchema>;

export interface GameArchiveClientOptions {
  apiBase: string;
  apiKey: string;
  fetcher?: typeof fetch;
}

export class GameArchiveClient {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(options: GameArchiveClientOptions) {
    this.apiBase = options.apiBase.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetcher = options.fetcher ?? fetch;
  }

  async archive(record: GameRecord): Promise<boolean> {
    const parsed = GameRecordSchema.safeParse(record);
    if (!parsed.success) {
      return false;
    }

    const response = await this.fetcher(
      `${this.apiBase}/game/${encodeURIComponent(parsed.data.info.gameID)}`,
      {
        method: "POST",
        body: JSON.stringify(parsed.data),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
      },
    );

    return response.ok;
  }

  async readGameRecord(gameID: string): Promise<GameRecord | null> {
    const response = await this.fetcher(
      `${this.apiBase}/game/${encodeURIComponent(gameID)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const body = await response.json();
    const parsed = GameRecordSchema.safeParse(body);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  }
}
