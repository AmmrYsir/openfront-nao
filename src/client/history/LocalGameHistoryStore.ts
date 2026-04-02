export interface LocalGameHistoryEntry {
  gameID: string;
  lobbyConfig: Record<string, unknown>;
  startedAt: number;
  finishedAt?: number;
  gameRecord?: Record<string, unknown>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "game-records";

export class LocalGameHistoryStore {
  private readonly storage: StorageLike | null;

  constructor(storage?: StorageLike) {
    this.storage = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  }

  list(): LocalGameHistoryEntry[] {
    return Object.values(this.readEntries()).sort((left, right) => right.startedAt - left.startedAt);
  }

  recordLobbyStart(gameID: string, lobbyConfig: Record<string, unknown>): void {
    const entries = this.readEntries();
    entries[gameID] = {
      gameID,
      lobbyConfig,
      startedAt: Date.now(),
    };
    this.writeEntries(entries);
  }

  recordGameEnd(gameID: string, gameRecord: Record<string, unknown>): void {
    const entries = this.readEntries();
    const existing = entries[gameID];
    if (!existing) {
      return;
    }

    entries[gameID] = {
      ...existing,
      finishedAt: Date.now(),
      gameRecord,
    };
    this.writeEntries(entries);
  }

  private readEntries(): Record<string, LocalGameHistoryEntry> {
    if (!this.storage) {
      return {};
    }

    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, LocalGameHistoryEntry>;
      if (!parsed || typeof parsed !== "object") {
        return {};
      }
      return parsed;
    } catch {
      return {};
    }
  }

  private writeEntries(entries: Record<string, LocalGameHistoryEntry>): void {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
}
