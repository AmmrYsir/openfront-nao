import type { Pool } from "pg";
import type { UserRepository, UserSummary } from "../types";

interface UserRow {
  id: string;
  display_name: string;
  email: string | null;
  discord_username: string | null;
}

export class PostgresUserRepository implements UserRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getByPersistentID(persistentID: string): Promise<UserSummary | null> {
    const result = await this.pool.query<UserRow>(
      `
      select id, display_name, email, discord_username
      from users
      where persistent_id = $1
      limit 1
      `,
      [persistentID],
    );

    if (result.rowCount !== 1) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      displayName: row.display_name,
      email: row.email,
      discordUsername: row.discord_username,
    };
  }

  async upsertByPersistentID(input: {
    persistentID: string;
    displayName: string;
    email?: string | null;
    discordUsername?: string | null;
  }): Promise<UserSummary> {
    const result = await this.pool.query<UserRow>(
      `
      insert into users (
        persistent_id,
        display_name,
        email,
        discord_username
      )
      values ($1, $2, $3, $4)
      on conflict (persistent_id)
      do update set
        display_name = excluded.display_name,
        email = excluded.email,
        discord_username = excluded.discord_username,
        updated_at = now()
      returning id, display_name, email, discord_username
      `,
      [
        input.persistentID,
        input.displayName,
        input.email ?? null,
        input.discordUsername ?? null,
      ],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      displayName: row.display_name,
      email: row.email,
      discordUsername: row.discord_username,
    };
  }
}
