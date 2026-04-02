import type { Pool } from "pg";
import type { LeaderboardRepository, RankedPlayerRow } from "../types";

interface RankedRow {
  player_id: string;
  elo: number;
  wins: number;
  losses: number;
}

interface CountRow {
  total: string;
}

export class PostgresLeaderboardRepository implements LeaderboardRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listRanked(
    page: number,
    pageSize: number,
  ): Promise<{ page: number; pageCount: number; players: RankedPlayerRow[] }> {
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.max(1, Math.min(200, Math.floor(pageSize)));
    const offset = (safePage - 1) * safePageSize;

    const countResult = await this.pool.query<CountRow>(`
      select count(*)::text as total from users
    `);
    const totalUsers = Number.parseInt(countResult.rows[0]?.total ?? "0", 10);
    const pageCount = Math.max(1, Math.ceil(totalUsers / safePageSize));

    const rows = await this.pool.query<RankedRow>(
      `
      select
        u.persistent_id as player_id,
        coalesce(r.elo, 1000) as elo,
        coalesce(r.wins, 0) as wins,
        coalesce(r.losses, 0) as losses
      from users u
      left join ranked_leaderboard r on r.user_id = u.id
      order by coalesce(r.elo, 1000) desc, u.persistent_id asc
      limit $1 offset $2
      `,
      [safePageSize, offset],
    );

    const players = rows.rows.map((row) => ({
      playerID: row.player_id,
      elo: row.elo,
      wins: row.wins,
      losses: row.losses,
    }));

    return {
      page: safePage,
      pageCount,
      players,
    };
  }

  async getByPersistentID(persistentID: string): Promise<RankedPlayerRow | null> {
    const result = await this.pool.query<RankedRow>(
      `
      select
        u.persistent_id as player_id,
        coalesce(r.elo, 1000) as elo,
        coalesce(r.wins, 0) as wins,
        coalesce(r.losses, 0) as losses
      from users u
      left join ranked_leaderboard r on r.user_id = u.id
      where u.persistent_id = $1
      limit 1
      `,
      [persistentID],
    );

    if (result.rowCount !== 1) {
      return null;
    }

    const row = result.rows[0];
    return {
      playerID: row.player_id,
      elo: row.elo,
      wins: row.wins,
      losses: row.losses,
    };
  }
}
