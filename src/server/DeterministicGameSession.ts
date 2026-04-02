import { IntentExecutionEngine } from "../game/execution/IntentExecutionEngine";
import { GameSessionStore, type GameSessionSnapshot } from "../game/state/GameSessionStore";
import type { Turn } from "../game/contracts/turn";

export interface DeterministicSessionBootstrap {
  mapId: string;
  mapSize: string;
  sourcePath: string;
  dimensions: {
    mapWidth: number;
    mapHeight: number;
    miniMapWidth: number;
    miniMapHeight: number;
  };
  nationCount: number;
  terrainData: Uint8Array;
  terrainMetrics: {
    landComponentCount: number;
    largestLandComponentSize: number;
    waterComponentCount: number;
    largestWaterComponentSize: number;
    sampleWaterPathLength: number | null;
  };
}

export class DeterministicGameSession {
  private readonly store = new GameSessionStore();
  private readonly executionEngine = new IntentExecutionEngine();
  private initialized = false;

  initialize(bootstrap: DeterministicSessionBootstrap): void {
    this.store.setMapBootstrap(
      bootstrap.mapId,
      bootstrap.mapSize,
      bootstrap.sourcePath,
      bootstrap.dimensions,
      bootstrap.nationCount,
      bootstrap.terrainData,
      bootstrap.terrainMetrics,
    );
    this.initialized = true;
  }

  applyTurn(turn: Turn): void {
    if (!this.initialized) {
      throw new Error("Deterministic session is not initialized.");
    }

    this.store.beginTurn(turn.turnNumber);
    this.executionEngine.applyTurn(this.store, turn);
    this.store.markTurnProcessed(turn);
    this.store.processTurnLifecycle(turn.turnNumber);
  }

  snapshot(): GameSessionSnapshot {
    return this.store.snapshot();
  }
}
