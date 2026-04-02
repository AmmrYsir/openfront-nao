export interface UserSummary {
  id: string;
  displayName: string;
  email: string | null;
  discordUsername: string | null;
}

export interface UserPreferenceRow {
  username: string;
  clanTag: string;
  language: string;
  darkMode: boolean;
  specialEffects: boolean;
  anonymousNames: boolean;
}

export interface RankedPlayerRow {
  playerID: string;
  elo: number;
  wins: number;
  losses: number;
}

export interface PublicLobbyRow {
  gameID: string;
  payload: Record<string, unknown>;
  updatedAt: number;
}

export interface GameRecordEnvelope {
  gameID: string;
  payload: Record<string, unknown>;
  status: "finished" | "in_progress" | "archived";
}

export interface UserRepository {
  getByPersistentID(persistentID: string): Promise<UserSummary | null>;
  upsertByPersistentID(input: {
    persistentID: string;
    displayName: string;
    email?: string | null;
    discordUsername?: string | null;
  }): Promise<UserSummary>;
}

export interface LeaderboardRepository {
  listRanked(page: number, pageSize: number): Promise<{
    page: number;
    pageCount: number;
    players: RankedPlayerRow[];
  }>;
  getByPersistentID(persistentID: string): Promise<RankedPlayerRow | null>;
}

export interface GameRecordRepository {
  getByGameID(gameID: string): Promise<GameRecordEnvelope | null>;
  upsert(record: GameRecordEnvelope): Promise<void>;
  exists(gameID: string): Promise<boolean>;
}

export interface LobbyRepository {
  listPublic(limit: number): Promise<PublicLobbyRow[]>;
  upsert(gameID: string, payload: Record<string, unknown>): Promise<void>;
  remove(gameID: string): Promise<void>;
}

export interface UserPreferencesRepository {
  getByPersistentID(persistentID: string): Promise<UserPreferenceRow | null>;
  upsertByPersistentID(
    persistentID: string,
    input: UserPreferenceRow,
  ): Promise<UserPreferenceRow | null>;
}
