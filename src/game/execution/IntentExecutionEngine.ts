import type { StampedIntent, Turn } from "../contracts/turn";
import { GameSessionStore } from "../state/GameSessionStore";

type IntentHandler = (
  store: GameSessionStore,
  intent: StampedIntent,
) => boolean;

const handleSpawn: IntentHandler = (store, intent) => {
  if (intent.type !== "spawn") {
    return false;
  }

  store.markSpawn(intent.tile);
  return true;
};

const handleTogglePause: IntentHandler = (store, intent) => {
  if (intent.type !== "toggle_pause") {
    return false;
  }

  store.setPaused(intent.paused);
  return true;
};

const handlers: IntentHandler[] = [handleSpawn, handleTogglePause];

export class IntentExecutionEngine {
  applyTurn(store: GameSessionStore, turn: Turn): void {
    for (const intent of turn.intents) {
      const handled = handlers.some((handler) => handler(store, intent));
      if (handled) {
        store.markIntentSupported();
      } else {
        // This intentionally mirrors the legacy ExecutionManager switch:
        // we track non-migrated intents while keeping queue processing alive.
        store.markIntentUnsupported();
      }
    }
  }
}
