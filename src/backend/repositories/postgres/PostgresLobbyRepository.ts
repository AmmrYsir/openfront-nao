import type { Pool } from "pg";
import type { LobbyRepository, PublicLobbyRow } from "../types";

interface LobbyRow {
  game_id: string;
  payload: Record<string, unknown>;
  updated_at: Date;
}

export class PostgresLobbyRepository implements LobbyRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listPublic(limit: number): Promise<PublicLobbyRow[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    const result = await this.pool.query<LobbyRow>(
      `
      select game_id, payload, updated_at
      from public_lobbies
      order by updated_at desc
      limit $1
      `,
      [safeLimit],
    );

    return result.rows.map((row) => ({
      gameID: row.game_id,
      payload: row.payload,
      updatedAt: row.updated_at.getTime(),
    }));
  }

  async upsert(gameID: string, payload: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      `
      insert into public_lobbies (game_id, payload)
      values ($1, $2::jsonb)
      on conflict (game_id)
      do update set
        payload = excluded.payload,
        updated_at = now()
      `,
      [gameID, JSON.stringify(payload)],
    );
  }

  async remove(gameID: string): Promise<void> {
    await this.pool.query(`delete from public_lobbies where game_id = $1`, [gameID]);
  }
}
