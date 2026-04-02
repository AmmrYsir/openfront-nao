import type { Turn, UnitType } from "../contracts/turn";
import {
  type ActionCounters,
  createActionCounters,
} from "./ActionCounters";

export interface GameSessionSnapshot {
  turnNumber: number;
  pendingTurnCount: number;
  processedTurnCount: number;
  totalIntentCount: number;
  supportedIntentCount: number;
  unsupportedIntentCount: number;
  lastHash: number | null;
  lastProcessedIntentType: string | null;
  paused: boolean;
  spawnedTileCount: number;
  lastSpawnTile: number | null;
  disconnectedClientCount: number;
  activeEmbargoCount: number;
  targetedPlayerCount: number;
  actionCounters: ActionCounters;
  donatedGoldTotal: number;
  donatedTroopsTotal: number;
  builtUnitTotal: number;
  lastConfigPatchSize: number;
  mapId: string | null;
  mapSize: string | null;
  mapLoaded: boolean;
  mapSourcePath: string | null;
  mapWidth: number | null;
  mapHeight: number | null;
  miniMapWidth: number | null;
  miniMapHeight: number | null;
  nationCount: number;
}

export class GameSessionStore {
  private pendingTurns: Turn[] = [];

  private turnNumber = 0;
  private processedTurnCount = 0;
  private totalIntentCount = 0;
  private supportedIntentCount = 0;
  private unsupportedIntentCount = 0;
  private lastHash: number | null = null;
  private lastProcessedIntentType: string | null = null;

  private paused = false;
  private spawnedTiles = new Set<number>();
  private lastSpawnTile: number | null = null;
  private disconnectedClients = new Set<string>();
  private embargoedPlayers = new Set<string>();
  private targetedPlayers = new Set<string>();
  private actionCounters = createActionCounters();
  private donatedGoldTotal = 0;
  private donatedTroopsTotal = 0;
  private builtUnitCountByType: Record<UnitType, number> = {
    Transport: 0,
    Warship: 0,
    Shell: 0,
    SAMMissile: 0,
    Port: 0,
    "Atom Bomb": 0,
    "Hydrogen Bomb": 0,
    "Trade Ship": 0,
    "Missile Silo": 0,
    "Defense Post": 0,
    "SAM Launcher": 0,
    City: 0,
    MIRV: 0,
    "MIRV Warhead": 0,
    Train: 0,
    Factory: 0,
  };
  private lastConfigPatchSize = 0;
  private mapId: string | null = null;
  private mapSize: string | null = null;
  private mapLoaded = false;
  private mapSourcePath: string | null = null;
  private mapWidth: number | null = null;
  private mapHeight: number | null = null;
  private miniMapWidth: number | null = null;
  private miniMapHeight: number | null = null;
  private nationCount = 0;

  enqueueTurn(turn: Turn): void {
    this.pendingTurns.push(turn);
  }

  hasPendingTurns(): boolean {
    return this.pendingTurns.length > 0;
  }

  dequeueTurn(): Turn | null {
    const nextTurn = this.pendingTurns.shift();
    return nextTurn ?? null;
  }

  markTurnProcessed(turn: Turn): void {
    this.turnNumber = Math.max(this.turnNumber, turn.turnNumber);
    this.processedTurnCount += 1;
    this.totalIntentCount += turn.intents.length;
    this.lastHash = turn.hash ?? this.lastHash;
    this.lastProcessedIntentType =
      turn.intents.length > 0
        ? turn.intents[turn.intents.length - 1].type
        : this.lastProcessedIntentType;
  }

  markIntentSupported(): void {
    this.supportedIntentCount += 1;
  }

  markIntentUnsupported(): void {
    this.unsupportedIntentCount += 1;
  }

  recordCombatAction(): void {
    this.actionCounters.combat += 1;
  }

  recordMovementAction(): void {
    this.actionCounters.movement += 1;
  }

  recordDiplomacyAction(): void {
    this.actionCounters.diplomacy += 1;
  }

  recordEconomyAction(): void {
    this.actionCounters.economy += 1;
  }

  recordConstructionAction(): void {
    this.actionCounters.construction += 1;
  }

  recordSocialAction(): void {
    this.actionCounters.social += 1;
  }

  recordModerationAction(): void {
    this.actionCounters.moderation += 1;
  }

  recordConfigurationAction(): void {
    this.actionCounters.configuration += 1;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  markSpawn(tile: number): void {
    this.spawnedTiles.add(tile);
    this.lastSpawnTile = tile;
  }

  setPlayerDisconnected(clientID: string, disconnected: boolean): void {
    if (disconnected) {
      this.disconnectedClients.add(clientID);
    } else {
      this.disconnectedClients.delete(clientID);
    }
  }

  setEmbargo(targetID: string, active: boolean): void {
    if (active) {
      this.embargoedPlayers.add(targetID);
    } else {
      this.embargoedPlayers.delete(targetID);
    }
  }

  setTargetPlayer(targetID: string): void {
    this.targetedPlayers.add(targetID);
  }

  addDonatedGold(amount: number | null): void {
    if (amount === null) {
      return;
    }
    this.donatedGoldTotal += Math.max(0, amount);
  }

  addDonatedTroops(amount: number | null): void {
    if (amount === null) {
      return;
    }
    this.donatedTroopsTotal += Math.max(0, amount);
  }

  incrementBuiltUnit(unitType: UnitType): void {
    this.builtUnitCountByType[unitType] += 1;
  }

  setLastConfigPatchSize(size: number): void {
    this.lastConfigPatchSize = Math.max(0, size);
  }

  setMapBootstrap(
    mapId: string,
    mapSize: string,
    sourcePath: string,
    dimensions: {
      mapWidth: number;
      mapHeight: number;
      miniMapWidth: number;
      miniMapHeight: number;
    },
    nationCount: number,
  ): void {
    this.mapId = mapId;
    this.mapSize = mapSize;
    this.mapSourcePath = sourcePath;
    this.mapLoaded = true;
    this.mapWidth = dimensions.mapWidth;
    this.mapHeight = dimensions.mapHeight;
    this.miniMapWidth = dimensions.miniMapWidth;
    this.miniMapHeight = dimensions.miniMapHeight;
    this.nationCount = Math.max(0, nationCount);
  }

  snapshot(): GameSessionSnapshot {
    return {
      turnNumber: this.turnNumber,
      pendingTurnCount: this.pendingTurns.length,
      processedTurnCount: this.processedTurnCount,
      totalIntentCount: this.totalIntentCount,
      supportedIntentCount: this.supportedIntentCount,
      unsupportedIntentCount: this.unsupportedIntentCount,
      lastHash: this.lastHash,
      lastProcessedIntentType: this.lastProcessedIntentType,
      paused: this.paused,
      spawnedTileCount: this.spawnedTiles.size,
      lastSpawnTile: this.lastSpawnTile,
      disconnectedClientCount: this.disconnectedClients.size,
      activeEmbargoCount: this.embargoedPlayers.size,
      targetedPlayerCount: this.targetedPlayers.size,
      actionCounters: {
        ...this.actionCounters,
      },
      donatedGoldTotal: this.donatedGoldTotal,
      donatedTroopsTotal: this.donatedTroopsTotal,
      builtUnitTotal: Object.values(this.builtUnitCountByType).reduce(
        (total, count) => total + count,
        0,
      ),
      lastConfigPatchSize: this.lastConfigPatchSize,
      mapId: this.mapId,
      mapSize: this.mapSize,
      mapLoaded: this.mapLoaded,
      mapSourcePath: this.mapSourcePath,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      miniMapWidth: this.miniMapWidth,
      miniMapHeight: this.miniMapHeight,
      nationCount: this.nationCount,
    };
  }
}
