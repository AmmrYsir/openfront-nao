import type { Turn } from "../contracts/turn";
import { GameSessionStore } from "../state/GameSessionStore";

export interface TurnQueueSystemOptions {
  maxTurnsPerStep: number;
  applyTurn: (turn: Turn) => void;
}

export class TurnQueueSystem {
  private readonly store: GameSessionStore;
  private readonly options: TurnQueueSystemOptions;

  constructor(store: GameSessionStore, options: TurnQueueSystemOptions) {
    this.store = store;
    this.options = options;
  }

  step(): number {
    let processedTurns = 0;
    while (
      processedTurns < this.options.maxTurnsPerStep &&
      this.store.hasPendingTurns()
    ) {
      const turn = this.store.dequeueTurn();
      if (!turn) {
        break;
      }

      this.options.applyTurn(turn);
      this.store.markTurnProcessed(turn);
      processedTurns += 1;
    }

    return processedTurns;
  }
}
