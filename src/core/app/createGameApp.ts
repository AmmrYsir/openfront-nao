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
import { AuthClient } from "../../client/auth/AuthClient";
import { PublicApiClient } from "../../client/api/PublicApiClient";
import { PublicLobbySocket } from "../../client/lobby/PublicLobbySocket";
import { LobbyDirectoryClient } from "../../client/lobby/LobbyDirectoryClient";
import { resolveBrowserRuntimeServerConfig } from "../../client/config/RuntimeServerConfig";
import { RankedMatchmakingSession } from "../../client/matchmaking/RankedMatchmakingSession";
import { UserPreferencesStore } from "../../client/settings/UserPreferencesStore";
import { MultiTabSessionGuard } from "../../client/session/MultiTabSessionGuard";
import {
  AccountPageController,
  ClassicPageController,
  HelpPageController,
  LeaderboardPageController,
  LobbyPageController,
  NewsPageController,
  SettingsPageController,
  SoloPageController,
} from "../../ui/pages";

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
  const authClient = new AuthClient();
  const apiClient = new PublicApiClient(authClient);
  const lobbyDirectoryClient = new LobbyDirectoryClient({
    apiKey: params.get("apiKey"),
  });
  const userPreferencesStore = new UserPreferencesStore();
  const multiTabGuard =
    typeof window !== "undefined" ? new MultiTabSessionGuard() : null;
  const runtimeServerConfig = resolveBrowserRuntimeServerConfig();
  let lobbyPageController: LobbyPageController | null = null;
  let soloAutoQueueTimer: ReturnType<typeof setInterval> | null = null;
  const rankedMatchmakingSession = new RankedMatchmakingSession({
    config: runtimeServerConfig,
    authClient,
    onStatus: (status) => uiRoot.setLobbyStatus(status),
    onAssigned: (gameID) => {
      lobbyPageController?.setAssignedGame(gameID);
    },
    onReady: (gameID) => {
      lobbyPageController?.setAssignedGame(gameID);
      uiRoot.setLobbyStatus(`Matchmaking game ready: ${gameID}`);
    },
  });
  const lobbySocket = new PublicLobbySocket(
    (publicGames) => {
      lobbyPageController?.setRealtimeCount(publicGames.lobbies.length);
      uiRoot.setLobbyStatus(`Public lobbies online: ${publicGames.lobbies.length}`);
    },
    {
      configProvider: async () => runtimeServerConfig,
      reconnectDelayMs: 2500,
      maxWsAttempts: 3,
    },
  );
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

  const accountPageController = new AccountPageController({
    host: uiRoot.getAccountPanelHost(),
    authClient,
    apiClient,
    onStatus: (status) => uiRoot.setAccountStatus(status),
  });
  const classicPageController = new ClassicPageController({
    host: uiRoot.getClassicPanelHost(),
    onStatus: (status) => uiRoot.setClassicStatus(status),
  });
  const soloPageController = new SoloPageController({
    host: uiRoot.getSoloPanelHost(),
    onQueueTurn: queueSampleTurn,
    onStartAutoQueue: async () => {
      await ensureWorkerInitialized();
      if (soloAutoQueueTimer !== null) {
        return;
      }
      soloAutoQueueTimer = setInterval(() => {
        void queueSampleTurn();
      }, 1200);
    },
    onStopAutoQueue: () => {
      if (soloAutoQueueTimer === null) {
        return;
      }
      clearInterval(soloAutoQueueTimer);
      soloAutoQueueTimer = null;
    },
    onStatus: (status) => uiRoot.setSoloStatus(status),
  });
  lobbyPageController = new LobbyPageController({
    host: uiRoot.getLobbyPanelHost(),
    lobbyDirectoryClient,
    onStartMatchmaking: async () => {
      await rankedMatchmakingSession.start();
    },
    onStopMatchmaking: () => {
      rankedMatchmakingSession.stop();
    },
    onStatus: (status) => uiRoot.setLobbyStatus(status),
  });
  const leaderboardPageController = new LeaderboardPageController({
    host: uiRoot.getLeaderboardPanelHost(),
    apiClient,
    onStatus: (status) => uiRoot.setLeaderboardStatus(status),
  });
  const settingsPageController = new SettingsPageController({
    host: uiRoot.getSettingsPanelHost(),
    preferencesStore: userPreferencesStore,
    apiClient,
    onStatus: (status) => uiRoot.setSettingsStatus(status),
  });
  const newsPageController = new NewsPageController({
    host: uiRoot.getNewsPanelHost(),
    onStatus: (status) => uiRoot.setNewsStatus(status),
  });
  const helpPageController = new HelpPageController({
    host: uiRoot.getHelpPanelHost(),
    onStatus: (status) => uiRoot.setHelpStatus(status),
  });

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

  async function hydrateClientServices(): Promise<void> {
    await classicPageController.hydrate();
    await soloPageController.hydrate();
    await accountPageController.hydrate();
    await leaderboardPageController.hydrate();
    if (lobbyPageController) {
      await lobbyPageController.hydrate();
    }
    await settingsPageController.hydrate();
    await newsPageController.hydrate();
    helpPageController.hydrate();

    uiRoot.setLobbyStatus("Connecting to lobby updates...");
    await lobbySocket.start();
  }

  return {
    start: () => {
      multiTabGuard?.startMonitoring((durationMs) => {
        uiRoot.setStatus(
          `Multiple tabs detected. Input cooldown for ${Math.round(durationMs / 1000)}s.`,
        );
      });
      void ensureWorkerInitialized().then(() => workerClient.getSnapshot());
      void hydrateClientServices().catch(() => {
        uiRoot.setAccountStatus("Account service error.");
        uiRoot.setClassicStatus("Classic UI service error.");
        uiRoot.setSoloStatus("Solo runtime service error.");
        uiRoot.setLobbyStatus("Lobby service error.");
        uiRoot.setLeaderboardStatus("Leaderboard service error.");
        uiRoot.setSettingsStatus("Settings service error.");
        uiRoot.setNewsStatus("News service error.");
        uiRoot.setHelpStatus("Help service error.");
      });
    },
    stop: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      multiTabGuard?.stopMonitoring();
      rankedMatchmakingSession.stop();
      if (soloAutoQueueTimer !== null) {
        clearInterval(soloAutoQueueTimer);
        soloAutoQueueTimer = null;
      }
      lobbySocket.stop();
      classicPageController.dispose();
      soloPageController.dispose();
      accountPageController.dispose();
      lobbyPageController?.dispose();
      leaderboardPageController.dispose();
      settingsPageController.dispose();
      newsPageController.dispose();
      helpPageController.dispose();
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
    mode: config.mode,
    legacySession: config.legacySession,
  });
}
