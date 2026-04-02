import type { Pool } from "pg";
import type {
  UserPreferenceRow,
  UserPreferencesRepository,
} from "../types";

interface PreferenceRow {
  username: string;
  clan_tag: string;
  language: string;
  dark_mode: boolean;
  special_effects: boolean;
  anonymous_names: boolean;
}

export class PostgresUserPreferencesRepository
  implements UserPreferencesRepository
{
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getByPersistentID(persistentID: string): Promise<UserPreferenceRow | null> {
    const result = await this.pool.query<PreferenceRow>(
      `
      select
        p.username,
        p.clan_tag,
        p.language,
        p.dark_mode,
        p.special_effects,
        p.anonymous_names
      from users u
      join user_preferences p on p.user_id = u.id
      where u.persistent_id = $1
      limit 1
      `,
      [persistentID],
    );

    if (result.rowCount !== 1) {
      return null;
    }

    return this.toPreferenceRow(result.rows[0]);
  }

  async upsertByPersistentID(
    persistentID: string,
    input: UserPreferenceRow,
  ): Promise<UserPreferenceRow | null> {
    const result = await this.pool.query<PreferenceRow>(
      `
      with target as (
        select id from users where persistent_id = $1 limit 1
      )
      insert into user_preferences (
        user_id,
        username,
        clan_tag,
        language,
        dark_mode,
        special_effects,
        anonymous_names,
        updated_at
      )
      select
        target.id,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        now()
      from target
      on conflict (user_id)
      do update set
        username = excluded.username,
        clan_tag = excluded.clan_tag,
        language = excluded.language,
        dark_mode = excluded.dark_mode,
        special_effects = excluded.special_effects,
        anonymous_names = excluded.anonymous_names,
        updated_at = now()
      returning
        username,
        clan_tag,
        language,
        dark_mode,
        special_effects,
        anonymous_names
      `,
      [
        persistentID,
        input.username,
        input.clanTag,
        input.language,
        input.darkMode,
        input.specialEffects,
        input.anonymousNames,
      ],
    );

    if (result.rowCount !== 1) {
      return null;
    }

    return this.toPreferenceRow(result.rows[0]);
  }

  private toPreferenceRow(row: PreferenceRow): UserPreferenceRow {
    return {
      username: row.username,
      clanTag: row.clan_tag,
      language: row.language,
      darkMode: row.dark_mode,
      specialEffects: row.special_effects,
      anonymousNames: row.anonymous_names,
    };
  }
}
