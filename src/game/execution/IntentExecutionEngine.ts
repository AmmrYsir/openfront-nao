import type { Turn } from "../contracts/turn";
import { GameSessionStore } from "../state/GameSessionStore";
import { intentHandlers } from "./handlers";

export class IntentExecutionEngine {
  applyTurn(store: GameSessionStore, turn: Turn): void {
    for (const intent of turn.intents) {
      const handler = intentHandlers[intent.type];
      if (handler) {
        (
          handler as (
            context: { store: GameSessionStore },
            payload: typeof intent,
          ) => void
        )({ store }, intent);
        store.markIntentSupported();
      } else {
        store.markIntentUnsupported();
      }
    }
  }
}
