import type { Turn } from "../contracts/turn";

export interface TurnTransport {
  connect(): Promise<void>;
  disconnect(): void;
  setTurnListener(listener?: (turn: Turn) => void): void;
  setErrorListener(listener?: (error: Error) => void): void;
}
