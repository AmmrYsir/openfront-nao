import type { Turn } from "../contracts/turn";
import { GameSessionStore } from "../state/GameSessionStore";
import { IntentRuleValidator } from "./IntentRuleValidator";
import { intentHandlers } from "./handlers";

export class IntentExecutionEngine {
  private readonly validator = new IntentRuleValidator();

  applyTurn(store: GameSessionStore, turn: Turn): void {
    for (const intent of turn.intents) {
      const handler = intentHandlers[intent.type];
      if (handler) {
        const validation = this.validator.validate(intent, turn.turnNumber);
        if (!validation.accepted) {
          store.markIntentSupported();
          store.markIntentRejected(intent.type, validation.reason ?? "unknown");
          continue;
        }

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
