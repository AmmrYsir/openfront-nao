export interface UserSummary {
  id: string;
  displayName: string;
  email: string | null;
  discordUsername: string | null;
}

export interface RankedPlayerRow {
  playerID: string;
  elo: number;
  wins: number;
  losses: number;
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
}

export interface GameRecordRepository {
  getByGameID(gameID: string): Promise<GameRecordEnvelope | null>;
  upsert(record: GameRecordEnvelope): Promise<void>;
  exists(gameID: string): Promise<boolean>;
}
