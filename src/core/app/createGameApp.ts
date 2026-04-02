import { EventBus } from "../events/EventBus";
import {
  type ClientId,
  type Turn,
  createSampleTurn,
} from "../../game/contracts/turn";
import {
  DEFAULT_MAP_RUNTIME_CONFIG,
  type MapRuntimeConfig,
} from "../../game/maps/MapRuntimeConfig";
import { Hud } from "../../ui/Hud";
import { GameWorkerClient } from "../../game/worker/GameWorkerClient";

interface AppEvents {
  "debug:queue-turn": undefined;
  "turn:queued": Turn;
}

export interface GameApp {
  start: () => void;
  stop: () => void;
}

const DEBUG_CLIENT_ID: ClientId = "DBG00001";

export function createGameApp(host: HTMLElement): GameApp {
  const events = new EventBus<AppEvents>();
  const workerClient = new GameWorkerClient({
    mapConfig: resolveMapConfigFromUrl(),
  });
  let nextTurnNumber = 1;
  let disposed = false;

  const queueSampleTurn = async (): Promise<void> => {
    if (!workerClient.isInitialized()) {
      await workerClient.initialize();
    }

    const turn = createSampleTurn(nextTurnNumber, DEBUG_CLIENT_ID);
    nextTurnNumber += 1;
    await workerClient.enqueueTurn(turn);
    events.emit("turn:queued", turn);
  };

  const hud = new Hud(host, () => {
    events.emit("debug:queue-turn", undefined);
  });

  workerClient.setSnapshotListener((snapshot) => {
    hud.render(snapshot);
  });

  const detachQueueHandler = events.on("debug:queue-turn", async () => {
    await queueSampleTurn();
  });

  return {
    start: () => {
      void workerClient.initialize().then(() => workerClient.getSnapshot());
    },
    stop: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      detachQueueHandler();
      events.clear();
      hud.dispose();
      workerClient.dispose();
    },
  };
}

function resolveMapConfigFromUrl(): MapRuntimeConfig {
  const params = new URLSearchParams(window.location.search);
  const mapId = params.get("map") ?? DEFAULT_MAP_RUNTIME_CONFIG.mapId;
  const compactRequested = params.get("compact");

  return {
    mapId,
    mapSize:
      compactRequested === "1" || compactRequested === "true"
        ? "compact"
        : DEFAULT_MAP_RUNTIME_CONFIG.mapSize,
  };
}
