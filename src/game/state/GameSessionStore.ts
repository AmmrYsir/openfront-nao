import type { Turn } from "../contracts/turn";

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

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  markSpawn(tile: number): void {
    this.spawnedTiles.add(tile);
    this.lastSpawnTile = tile;
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
    };
  }
}
