import { z } from "zod";
import {
  pickRandomWorkerPath,
  resolveBrowserRuntimeServerConfig,
  type RuntimeServerConfig,
} from "../config/RuntimeServerConfig";

const PublicLobbyEntrySchema = z.object({
  gameID: z.string(),
  playerCount: z.number().optional(),
  maxPlayers: z.number().optional(),
});

const PublicGamesSchema = z.object({
  lobbies: z.array(PublicLobbyEntrySchema),
});

export type PublicGames = z.infer<typeof PublicGamesSchema>;

export function parsePublicGamesPayload(payload: unknown): PublicGames | null {
  const parsed = PublicGamesSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export interface LobbySocketOptions {
  reconnectDelayMs?: number;
  maxWsAttempts?: number;
  configProvider?: () => Promise<RuntimeServerConfig>;
  websocketFactory?: (url: string) => WebSocket;
}

function defaultWebSocketFactory(url: string): WebSocket {
  return new WebSocket(url);
}

export class PublicLobbySocket {
  private readonly onLobbiesUpdate: (data: PublicGames) => void;
  private ws: WebSocket | null = null;
  private wsReconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private wsConnectionAttempts = 0;
  private wsAttemptCounted = false;
  private workerPath = "";
  private stopped = true;

  private readonly reconnectDelayMs: number;
  private readonly maxWsAttempts: number;
  private readonly configProvider: () => Promise<RuntimeServerConfig>;
  private readonly websocketFactory: (url: string) => WebSocket;

  constructor(
    onLobbiesUpdate: (data: PublicGames) => void,
    options?: LobbySocketOptions,
  ) {
    this.onLobbiesUpdate = onLobbiesUpdate;
    this.reconnectDelayMs = options?.reconnectDelayMs ?? 3000;
    this.maxWsAttempts = options?.maxWsAttempts ?? 3;
    this.configProvider =
      options?.configProvider ??
      (async () => resolveBrowserRuntimeServerConfig());
    this.websocketFactory = options?.websocketFactory ?? defaultWebSocketFactory;
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.wsConnectionAttempts = 0;
    const config = await this.configProvider();
    this.workerPath = pickRandomWorkerPath(config.numWorkers());
    this.connectWebSocket();
  }

  stop(): void {
    this.stopped = true;
    this.disconnectWebSocket();
  }

  private connectWebSocket(): void {
    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      if (typeof window === "undefined") {
        throw new Error("PublicLobbySocket requires browser window context.");
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}${this.workerPath}/lobbies`;
      this.ws = this.websocketFactory(wsUrl);
      this.wsAttemptCounted = false;

      this.ws.addEventListener("open", () => this.handleOpen());
      this.ws.addEventListener("message", (event) => this.handleMessage(event));
      this.ws.addEventListener("close", () => this.handleClose());
      this.ws.addEventListener("error", () => this.handleError());
    } catch {
      this.handleConnectError();
    }
  }

  private handleOpen(): void {
    this.wsConnectionAttempts = 0;
    if (this.wsReconnectTimeout !== null) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(String(event.data));
    } catch {
      this.closeSocketOnParserFailure();
      return;
    }

    const parsed = parsePublicGamesPayload(parsedJson);
    if (!parsed) {
      this.closeSocketOnParserFailure();
      return;
    }

    this.onLobbiesUpdate(parsed);
  }

  private closeSocketOnParserFailure(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.close();
      } catch {
        // Ignore socket close failure.
      }
    }
  }

  private handleClose(): void {
    if (this.stopped) return;
    if (!this.wsAttemptCounted) {
      this.wsAttemptCounted = true;
      this.wsConnectionAttempts += 1;
    }

    if (this.wsConnectionAttempts < this.maxWsAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    // Connection recovery is handled on close.
  }

  private handleConnectError(): void {
    if (!this.wsAttemptCounted) {
      this.wsAttemptCounted = true;
      this.wsConnectionAttempts += 1;
    }
    if (this.wsConnectionAttempts < this.maxWsAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.wsReconnectTimeout !== null) {
      return;
    }

    this.wsReconnectTimeout = setTimeout(() => {
      this.wsReconnectTimeout = null;
      this.connectWebSocket();
    }, this.reconnectDelayMs);
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.wsReconnectTimeout !== null) {
      clearTimeout(this.wsReconnectTimeout);
      this.wsReconnectTimeout = null;
    }
  }
}
