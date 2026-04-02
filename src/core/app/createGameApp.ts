import { EventBus } from "../events/EventBus";
import { FixedStepLoop } from "../loop/FixedStepLoop";
import {
  type ClientId,
  type Turn,
  createSampleTurn,
} from "../../game/contracts/turn";
import { GameSessionStore } from "../../game/state/GameSessionStore";
import { TurnQueueSystem } from "../../game/systems/TurnQueueSystem";
import { Hud } from "../../ui/Hud";

interface AppEvents {
  "debug:queue-turn": undefined;
  "turn:queued": Turn;
  "turn:processed": Turn;
}

export interface GameApp {
  start: () => void;
  stop: () => void;
}

const STEP_MS = 100;
const MAX_TURNS_PER_STEP = 4;
const DEBUG_CLIENT_ID: ClientId = "local-debug-client";

export function createGameApp(host: HTMLElement): GameApp {
  const events = new EventBus<AppEvents>();
  const sessionStore = new GameSessionStore();
  let nextTurnNumber = 1;

  const queueSampleTurn = (): void => {
    const turn = createSampleTurn(nextTurnNumber, DEBUG_CLIENT_ID);
    nextTurnNumber += 1;
    sessionStore.enqueueTurn(turn);
    events.emit("turn:queued", turn);
  };

  const hud = new Hud(host, () => {
    events.emit("debug:queue-turn", undefined);
  });

  const turnQueueSystem = new TurnQueueSystem(sessionStore, {
    maxTurnsPerStep: MAX_TURNS_PER_STEP,
    applyTurn: (turn) => {
      events.emit("turn:processed", turn);
    },
  });

  const loop = new FixedStepLoop({
    stepMs: STEP_MS,
    maxCatchUpSteps: 5,
    onStep: () => {
      turnQueueSystem.step();
      hud.render(sessionStore.snapshot());
    },
    onFrame: () => {
      // Keep frame hook for future camera interpolation and renderer updates.
    },
  });

  const detachQueueHandler = events.on("debug:queue-turn", () => {
    queueSampleTurn();
  });

  hud.render(sessionStore.snapshot());

  return {
    start: () => {
      loop.start();
    },
    stop: () => {
      loop.stop();
      detachQueueHandler();
      events.clear();
      hud.dispose();
    },
  };
}
