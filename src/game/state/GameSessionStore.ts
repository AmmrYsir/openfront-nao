import type { Turn } from "../contracts/turn";

export interface GameSessionSnapshot {
  turnNumber: number;
  pendingTurnCount: number;
  processedTurnCount: number;
  totalIntentCount: number;
  lastHash: number | null;
  lastProcessedIntentType: string | null;
}

export class GameSessionStore {
  private pendingTurns: Turn[] = [];
  private turnNumber = 0;
  private processedTurnCount = 0;
  private totalIntentCount = 0;
  private lastHash: number | null = null;
  private lastProcessedIntentType: string | null = null;

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

  snapshot(): GameSessionSnapshot {
    return {
      turnNumber: this.turnNumber,
      pendingTurnCount: this.pendingTurns.length,
      processedTurnCount: this.processedTurnCount,
      totalIntentCount: this.totalIntentCount,
      lastHash: this.lastHash,
      lastProcessedIntentType: this.lastProcessedIntentType,
    };
  }
}
