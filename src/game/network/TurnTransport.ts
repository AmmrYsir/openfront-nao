import type { Turn } from "../contracts/turn";
import type { Intent } from "../contracts/turn";

export interface TurnTransport {
  connect(): Promise<void>;
  disconnect(): void;
  sendIntent(intent: Intent): void;
  sendPing(): void;
  setTurnListener(listener?: (turn: Turn) => void): void;
  setErrorListener(listener?: (error: Error) => void): void;
}
