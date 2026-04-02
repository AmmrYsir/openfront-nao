import { LocalGameHistoryStore } from "../history/LocalGameHistoryStore";

export type SoloMapSize = "normal" | "compact";
export type SoloMode = "ffa" | "team";
export type SoloTeamCount = 2 | 3 | 4;

export interface LocalSoloConfig {
  mapId: string;
  mapSize: SoloMapSize;
  bots: number;
  mode: SoloMode;
  teamCount: SoloTeamCount;
}

export interface LocalSoloSession {
  gameID: string;
  createdAt: number;
  config: LocalSoloConfig;
}

export interface RawLocalSoloConfig {
  mapId?: string;
  mapSize?: string;
  bots?: number;
  mode?: string;
  teamCount?: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface LocalServerOptions {
  historyStore?: LocalGameHistoryStore;
  storage?: StorageLike | null;
  now?: () => number;
}

const SOLO_LAST_CONFIG_KEY = "solo-last-config";

const DEFAULT_SOLO_CONFIG: LocalSoloConfig = {
  mapId: "World",
  mapSize: "normal",
  bots: 80,
  mode: "ffa",
  teamCount: 2,
};

function generateGameId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    const compact = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    return `SOLO-${compact}`;
  }

  const random = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `SOLO-${random}`;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeTeamCount(value: number): SoloTeamCount {
  if (value <= 2) {
    return 2;
  }
  if (value >= 4) {
    return 4;
  }
  return 3;
}

function normalizeMode(value: string): SoloMode {
  return value === "team" ? "team" : "ffa";
}

function normalizeMapSize(value: string): SoloMapSize {
  return value === "compact" ? "compact" : "normal";
}

export function normalizeSoloConfig(input: RawLocalSoloConfig): LocalSoloConfig {
  const mapId = (input.mapId ?? DEFAULT_SOLO_CONFIG.mapId).trim();
  return {
    mapId: mapId.length > 0 ? mapId : DEFAULT_SOLO_CONFIG.mapId,
    mapSize: normalizeMapSize(input.mapSize ?? DEFAULT_SOLO_CONFIG.mapSize),
    bots: clampInt(input.bots ?? DEFAULT_SOLO_CONFIG.bots, 0, 400),
    mode: normalizeMode(input.mode ?? DEFAULT_SOLO_CONFIG.mode),
    teamCount: normalizeTeamCount(input.teamCount ?? DEFAULT_SOLO_CONFIG.teamCount),
  };
}

export class LocalServer {
  private readonly historyStore: LocalGameHistoryStore;
  private readonly storage: StorageLike | null;
  private readonly now: () => number;

  constructor(options: LocalServerOptions = {}) {
    this.storage =
      options.storage ?? (typeof localStorage === "undefined" ? null : localStorage);
    this.historyStore = options.historyStore ?? new LocalGameHistoryStore(this.storage ?? undefined);
    this.now = options.now ?? (() => Date.now());
  }

  getDefaultConfig(): LocalSoloConfig {
    return normalizeSoloConfig(this.readLastConfig() ?? DEFAULT_SOLO_CONFIG);
  }

  readLastConfig(): LocalSoloConfig | null {
    if (!this.storage) {
      return null;
    }

    const raw = this.storage.getItem(SOLO_LAST_CONFIG_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LocalSoloConfig>;
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return normalizeSoloConfig(parsed);
    } catch {
      return null;
    }
  }

  createSession(input: RawLocalSoloConfig): LocalSoloSession {
    const config = normalizeSoloConfig(input);
    const session: LocalSoloSession = {
      gameID: generateGameId(),
      createdAt: this.now(),
      config,
    };

    this.historyStore.recordLobbyStart(session.gameID, {
      mode: "solo",
      gameType: "singleplayer",
      config,
    });
    this.persistLastConfig(config);
    return session;
  }

  buildRuntimeSearch(currentSearch: string, config: LocalSoloConfig): string {
    const next = new URLSearchParams(currentSearch);
    next.set("map", config.mapId);
    if (config.mapSize === "compact") {
      next.set("compact", "1");
    } else {
      next.delete("compact");
    }
    return `?${next.toString()}`;
  }

  requiresRuntimeReload(currentSearch: string, config: LocalSoloConfig): boolean {
    return this.buildRuntimeSearch(currentSearch, config) !== currentSearch;
  }

  private persistLastConfig(config: LocalSoloConfig): void {
    if (!this.storage) {
      return;
    }
    this.storage.setItem(SOLO_LAST_CONFIG_KEY, JSON.stringify(config));
  }
}
