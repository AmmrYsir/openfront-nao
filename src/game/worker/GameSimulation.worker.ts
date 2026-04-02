import type { MainToWorkerMessage, WorkerToMainMessage } from "./messages";
import { GameSessionStore } from "../state/GameSessionStore";
import { TurnQueueSystem } from "../systems/TurnQueueSystem";
import { parseTurn } from "../contracts/intentSchemas";
import { IntentExecutionEngine } from "../execution/IntentExecutionEngine";

const ctx: Worker = self as unknown as Worker;
const store = new GameSessionStore();
const executionEngine = new IntentExecutionEngine();
const turnQueueSystem = new TurnQueueSystem(store, {
  maxTurnsPerStep: 4,
  applyTurn: (turn) => {
    executionEngine.applyTurn(store, turn);
  },
});

let initialized = false;
let drainScheduled = false;
let draining = false;

function post(message: WorkerToMainMessage): void {
  ctx.postMessage(message);
}

function postSnapshot(id?: string): void {
  post({
    type: "snapshot",
    id,
    snapshot: store.snapshot(),
  });
}

function scheduleDrain(): void {
  if (drainScheduled || draining) {
    return;
  }

  drainScheduled = true;
  setTimeout(() => {
    void drain();
  }, 0);
}

async function drain(): Promise<void> {
  drainScheduled = false;
  if (draining) {
    return;
  }

  draining = true;
  try {
    let processedAny = false;
    while (store.hasPendingTurns()) {
      const processed = turnQueueSystem.step();
      if (processed <= 0) {
        break;
      }
      processedAny = true;
    }

    if (processedAny) {
      postSnapshot();
    }
  } finally {
    draining = false;
  }
}

ctx.addEventListener("message", (event: MessageEvent<MainToWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "init":
      initialized = true;
      post({
        type: "initialized",
        id: message.id,
        snapshot: store.snapshot(),
      });
      return;

    case "enqueue_turn":
      if (!initialized) {
        throw new Error("Simulation worker not initialized.");
      }

      store.enqueueTurn(parseTurn(message.turn));
      post({
        type: "ack",
        id: message.id,
        ok: true,
      });
      scheduleDrain();
      return;

    case "get_snapshot":
      if (!initialized) {
        throw new Error("Simulation worker not initialized.");
      }

      postSnapshot(message.id);
      return;

    default:
      return;
  }
});
