import type { Turn } from "../../game/contracts/turn";
import type { GameSessionSnapshot } from "../../game/state/GameSessionStore";

export interface SimulationClient {
  initialize(): Promise<GameSessionSnapshot>;
  isInitialized(): boolean;
  enqueueTurn(turn: Turn): Promise<void>;
  getSnapshot(): Promise<GameSessionSnapshot>;
  setSnapshotListener(listener?: (snapshot: GameSessionSnapshot) => void): void;
  dispose(): void;
}
