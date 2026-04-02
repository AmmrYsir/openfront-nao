import type { Pool } from "pg";
import type { GameRecordEnvelope, GameRecordRepository } from "../types";

interface GameRow {
  game_id: string;
  payload: Record<string, unknown>;
  status: "finished" | "in_progress" | "archived";
}

interface ExistsRow {
  exists: boolean;
}

export class PostgresGameRecordRepository implements GameRecordRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getByGameID(gameID: string): Promise<GameRecordEnvelope | null> {
    const result = await this.pool.query<GameRow>(
      `
      select game_id, payload, status
      from game_records
      where game_id = $1
      limit 1
      `,
      [gameID],
    );

    if (result.rowCount !== 1) {
      return null;
    }

    const row = result.rows[0];
    return {
      gameID: row.game_id,
      payload: row.payload,
      status: row.status,
    };
  }

  async upsert(record: GameRecordEnvelope): Promise<void> {
    await this.pool.query(
      `
      insert into game_records (game_id, payload, status)
      values ($1, $2::jsonb, $3)
      on conflict (game_id)
      do update set
        payload = excluded.payload,
        status = excluded.status,
        updated_at = now()
      `,
      [record.gameID, JSON.stringify(record.payload), record.status],
    );
  }

  async exists(gameID: string): Promise<boolean> {
    const result = await this.pool.query<ExistsRow>(
      `
      select exists(
        select 1 from game_records where game_id = $1
      ) as exists
      `,
      [gameID],
    );
    return result.rows[0]?.exists === true;
  }
}
