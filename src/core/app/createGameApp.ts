import type { SimulationClient } from "../ports/SimulationClient";
import { EventBus } from "../events/EventBus";
import {
  type ClientId,
  type Turn,
  createSampleTurn,
} from "../../game/contracts/turn";
import { resolveMapConfigFromSearchParams } from "../../game/maps/MapConfigResolver";
import type { TurnTransport } from "../../game/network/TurnTransport";
import { resolveLiveTurnTransportConfig } from "../../game/network/TurnTransportResolver";
import { WebSocketTurnTransport } from "../../game/network/WebSocketTurnTransport";
import { Hud } from "../../ui/Hud";
import { AppUiRoot } from "../../ui/AppUiRoot";
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
  const params = new URLSearchParams(window.location.search);
  const workerClient: SimulationClient = new GameWorkerClient({
    mapConfig: resolveMapConfigFromSearchParams(params),
  });
  const liveTransport = createTurnTransportFromSearchParams(params);
  const uiRoot = new AppUiRoot(host, {
    hasLiveTransport: liveTransport !== null,
    onConnectLiveTransport: () => {
      void connectLiveTransport();
    },
    onDisconnectLiveTransport: () => {
      disconnectLiveTransport("Live transport disconnected.");
    },
  });
  let nextTurnNumber = 1;
  let disposed = false;

  const queueSampleTurn = async (): Promise<void> => {
    uiRoot.setStatus("Queueing local sample turn...");
    if (!workerClient.isInitialized()) {
      await workerClient.initialize();
    }

    const turn = createSampleTurn(nextTurnNumber, DEBUG_CLIENT_ID);
    nextTurnNumber += 1;
    await workerClient.enqueueTurn(turn);
    events.emit("turn:queued", turn);
    uiRoot.setStatus(`Queued local sample turn ${turn.turnNumber}.`);
  };

  const hud = new Hud(uiRoot.getHudHost(), () => {
    events.emit("debug:queue-turn", undefined);
  });

  workerClient.setSnapshotListener((snapshot) => {
    hud.render(snapshot);
  });

  const detachQueueHandler = events.on("debug:queue-turn", async () => {
    await queueSampleTurn();
  });

  if (liveTransport) {
    liveTransport.setTurnListener((turn) => {
      void enqueueLiveTurn(turn);
    });
    liveTransport.setErrorListener((error) => {
      uiRoot.setStatus(`Live transport error: ${error.message}`);
      uiRoot.setLiveTransportState("disconnected");
    });
  }

  async function ensureWorkerInitialized(): Promise<void> {
    if (workerClient.isInitialized()) {
      return;
    }
    await workerClient.initialize();
    uiRoot.setStatus("Simulation worker initialized.");
  }

  async function enqueueLiveTurn(turn: Turn): Promise<void> {
    await ensureWorkerInitialized();
    await workerClient.enqueueTurn(turn);
    events.emit("turn:queued", turn);
    uiRoot.setStatus(`Queued live server turn ${turn.turnNumber}.`);
  }

  async function connectLiveTransport(): Promise<void> {
    if (!liveTransport) {
      return;
    }
    uiRoot.setLiveTransportState("connecting");
    uiRoot.setStatus("Connecting live turn transport...");
    try {
      await ensureWorkerInitialized();
      await liveTransport.connect();
      uiRoot.setLiveTransportState("connected");
      uiRoot.setStatus("Live turn transport connected.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown live transport error.";
      uiRoot.setLiveTransportState("disconnected");
      uiRoot.setStatus(`Failed to connect live transport: ${message}`);
    }
  }

  function disconnectLiveTransport(status: string): void {
    if (!liveTransport) {
      return;
    }
    liveTransport.disconnect();
    uiRoot.setLiveTransportState("disconnected");
    uiRoot.setStatus(status);
  }

  return {
    start: () => {
      void ensureWorkerInitialized().then(() => workerClient.getSnapshot());
    },
    stop: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      liveTransport?.disconnect();
      detachQueueHandler();
      events.clear();
      hud.dispose();
      uiRoot.dispose();
      workerClient.dispose();
    },
  };
}

function createTurnTransportFromSearchParams(
  params: URLSearchParams,
): TurnTransport | null {
  const config = resolveLiveTurnTransportConfig(params);
  if (!config) {
    return null;
  }

  return new WebSocketTurnTransport({
    url: config.url,
    gameID: config.gameID,
  });
}
