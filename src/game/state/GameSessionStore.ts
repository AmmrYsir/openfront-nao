import type { Turn, UnitType } from "../contracts/turn";
import {
  type ActionCounters,
  createActionCounters,
} from "./ActionCounters";
import { ProjectedWorldState } from "./ProjectedWorldState";

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
  projectedPlayerCount: number;
  projectedAllianceCount: number;
  pendingAllianceRequestCount: number;
  pendingAttackCount: number;
  pendingBoatAttackCount: number;
  kickedPlayerCount: number;
  expiredAllianceCount: number;
  expiredAllianceRequestCount: number;
  blockedAllianceRequestCount: number;
  blockedTargetCount: number;
  allianceInExtensionWindowCount: number;
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
  private projectedWorld = new ProjectedWorldState();
  private actionCounters = createActionCounters();
  private donatedGoldTotal = 0;
  private donatedTroopsTotal = 0;
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

  beginTurn(turnNumber: number): void {
    this.projectedWorld.setCurrentTick(turnNumber);
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
    this.projectedWorld.setCurrentTick(this.turnNumber);
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

  markSpawn(clientID: string, tile: number): void {
    this.spawnedTiles.add(tile);
    this.lastSpawnTile = tile;
    this.projectedWorld.recordSpawn(clientID, tile);
  }

  setPlayerDisconnected(clientID: string, disconnected: boolean): void {
    this.projectedWorld.recordDisconnected(clientID, disconnected);
  }

  setEmbargo(playerID: string, targetID: string, active: boolean): void {
    this.projectedWorld.recordEmbargo(playerID, targetID, active);
  }

  setTargetPlayer(playerID: string, targetID: string): void {
    this.projectedWorld.recordTarget(playerID, targetID);
  }

  addDonatedGold(
    senderID: string,
    recipientID: string,
    amount: number | null,
  ): void {
    if (amount === null) {
      return;
    }
    this.donatedGoldTotal += Math.max(0, amount);
    this.projectedWorld.recordDonation(senderID, recipientID, "gold", amount);
  }

  addDonatedTroops(
    senderID: string,
    recipientID: string,
    amount: number | null,
  ): void {
    if (amount === null) {
      return;
    }
    this.donatedTroopsTotal += Math.max(0, amount);
    this.projectedWorld.recordDonation(senderID, recipientID, "troops", amount);
  }

  incrementBuiltUnit(playerID: string, unitType: UnitType): void {
    this.projectedWorld.recordBuildUnit(playerID, unitType);
  }

  setLastConfigPatchSize(size: number): void {
    this.lastConfigPatchSize = Math.max(0, size);
  }

  recordAttack(
    attackerID: string,
    targetID: string | null,
    troops: number | null,
  ): void {
    this.projectedWorld.recordAttack(attackerID, targetID, troops);
  }

  recordCancelAttack(): void {
    this.projectedWorld.recordCancelAttack();
  }

  recordBoatAttack(attackerID: string, troops: number): void {
    this.projectedWorld.recordBoatAttack(attackerID, troops);
  }

  recordCancelBoat(): void {
    this.projectedWorld.recordCancelBoat();
  }

  recordAllianceRequest(requestorID: string, recipientID: string): void {
    this.projectedWorld.recordAllianceRequest(requestorID, recipientID);
  }

  recordAllianceReject(requestorID: string, rejectorID: string): void {
    this.projectedWorld.recordAllianceReject(requestorID, rejectorID);
  }

  recordAllianceExtension(senderID: string, recipientID: string): void {
    this.projectedWorld.recordAllianceExtension(senderID, recipientID);
  }

  recordBreakAlliance(playerA: string, playerB: string): void {
    this.projectedWorld.recordBreakAlliance(playerA, playerB);
  }

  recordUpgradeStructure(playerID: string): void {
    this.projectedWorld.recordUpgradeStructure(playerID);
  }

  recordDeleteUnit(playerID: string): void {
    this.projectedWorld.recordDeleteUnit(playerID);
  }

  recordMoveWarship(playerID: string): void {
    this.projectedWorld.recordMoveWarship(playerID);
  }

  recordKickPlayer(playerID: string): void {
    this.projectedWorld.recordKickPlayer(playerID);
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
    const projectedSummary = this.projectedWorld.getSummary();

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
      disconnectedClientCount: projectedSummary.disconnectedPlayerCount,
      activeEmbargoCount: projectedSummary.activeEmbargoCount,
      targetedPlayerCount: projectedSummary.targetedPlayerCount,
      actionCounters: {
        ...this.actionCounters,
      },
      donatedGoldTotal: this.donatedGoldTotal,
      donatedTroopsTotal: this.donatedTroopsTotal,
      builtUnitTotal: projectedSummary.builtUnitTotal,
      lastConfigPatchSize: this.lastConfigPatchSize,
      projectedPlayerCount: projectedSummary.playerCount,
      projectedAllianceCount: projectedSummary.allianceCount,
      pendingAllianceRequestCount: projectedSummary.pendingAllianceRequestCount,
      pendingAttackCount: projectedSummary.pendingAttackCount,
      pendingBoatAttackCount: projectedSummary.pendingBoatAttackCount,
      kickedPlayerCount: projectedSummary.kickedPlayerCount,
      expiredAllianceCount: projectedSummary.expiredAllianceCount,
      expiredAllianceRequestCount: projectedSummary.expiredAllianceRequestCount,
      blockedAllianceRequestCount: projectedSummary.blockedAllianceRequestCount,
      blockedTargetCount: projectedSummary.blockedTargetCount,
      allianceInExtensionWindowCount:
        projectedSummary.allianceInExtensionWindowCount,
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
