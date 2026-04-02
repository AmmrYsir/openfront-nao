import type { MainToWorkerMessage, WorkerToMainMessage } from "./messages";
import { GameSessionStore } from "../state/GameSessionStore";
import { TurnQueueSystem } from "../systems/TurnQueueSystem";
import { parseTurn } from "../contracts/intentSchemas";
import { IntentExecutionEngine } from "../execution/IntentExecutionEngine";
import {
  LEGACY_MAPS_ROOT,
  legacyMapUrl,
} from "../../core/assets/legacyAssets";
import { FetchGameMapLoader } from "../maps/FetchGameMapLoader";
import { loadTerrainMap } from "../maps/TerrainMapLoader";

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

function createLegacyMapLoader(): FetchGameMapLoader {
  return new FetchGameMapLoader((path) => legacyMapUrl(path));
}

async function handleMessage(message: MainToWorkerMessage): Promise<void> {
  switch (message.type) {
    case "init": {
      const mapLoader = createLegacyMapLoader();
      const terrainMap = await loadTerrainMap(
        message.mapConfig.mapId,
        message.mapConfig.mapSize,
        mapLoader,
      );

      store.setMapBootstrap(
        message.mapConfig.mapId,
        message.mapConfig.mapSize,
        `/${LEGACY_MAPS_ROOT}`,
        {
          mapWidth: terrainMap.gameMap.width,
          mapHeight: terrainMap.gameMap.height,
          miniMapWidth: terrainMap.miniGameMap.width,
          miniMapHeight: terrainMap.miniGameMap.height,
        },
        terrainMap.nations.length,
      );

      initialized = true;
      post({
        type: "initialized",
        id: message.id,
        snapshot: store.snapshot(),
      });
      return;
    }

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
}

ctx.addEventListener("message", (event: MessageEvent<MainToWorkerMessage>) => {
  void handleMessage(event.data).catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`Simulation worker message failure: ${errorMessage}`);
  });
});
