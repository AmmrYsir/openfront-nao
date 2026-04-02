import type { Intent, Turn } from "../contracts/turn";
import {
  buildLegacyIntentMessage,
  buildLegacyJoinOrRejoinMessage,
  buildLegacyPingMessage,
  extractServerErrorMessage,
  parseServerMessage,
  toServerTurnEnvelope,
} from "./serverMessages";
import type { TurnTransport } from "./TurnTransport";

interface LegacySessionOptions {
  username: string;
  token: string;
  clanTag: string | null;
  turnstileToken: string | null;
  lastTurn?: number;
}

interface WebSocketTurnTransportOptions {
  url: string;
  gameID: string;
  mode: "legacy" | "modern";
  legacySession: LegacySessionOptions | null;
}

export class WebSocketTurnTransport implements TurnTransport {
  private readonly url: string;
  private readonly gameID: string;
  private readonly mode: "legacy" | "modern";
  private readonly legacySession: LegacySessionOptions | null;

  private socket: WebSocket | null = null;
  private turnListener?: (turn: Turn) => void;
  private errorListener?: (error: Error) => void;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private reconnectEnabled = true;
  private connectPromise: Promise<void> | null = null;

  constructor(options: WebSocketTurnTransportOptions) {
    this.url = options.url;
    this.gameID = options.gameID;
    this.mode = options.mode;
    this.legacySession = options.legacySession;
  }

  async connect(): Promise<void> {
    if (this.socket !== null) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.reconnectEnabled = true;
    this.connectPromise = this.establishConnection().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  disconnect(): void {
    this.reconnectEnabled = false;
    this.clearReconnectTimer();
    this.stopPing();
    this.closeSocket();
  }

  sendIntent(intent: Intent): void {
    if (this.mode !== "legacy") {
      this.emitError(
        new Error(
          "Intent transport is only defined for legacy websocket mode.",
        ),
      );
      return;
    }
    this.send(buildLegacyIntentMessage(intent));
  }

  sendPing(): void {
    if (this.mode === "legacy") {
      this.send(buildLegacyPingMessage());
      return;
    }

    this.send({
      type: "client:ping",
      payload: {
        gameID: this.gameID,
      },
    });
  }

  setTurnListener(listener?: (turn: Turn) => void): void {
    this.turnListener = listener;
  }

  setErrorListener(listener?: (error: Error) => void): void {
    this.errorListener = listener;
  }

  private async establishConnection(): Promise<void> {
    const socket = new WebSocket(this.url);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const openHandler = (): void => {
        socket.removeEventListener("error", errorHandler);
        resolve();
      };

      const errorHandler = (): void => {
        socket.removeEventListener("open", openHandler);
        reject(new Error("Failed to connect turn transport socket."));
      };

      socket.addEventListener("open", openHandler, { once: true });
      socket.addEventListener("error", errorHandler, { once: true });
    });

    socket.addEventListener("message", this.handleMessage);
    socket.addEventListener("error", this.handleSocketError);
    socket.addEventListener("close", this.handleSocketClose);
    this.reconnectAttempts = 0;

    this.bootstrapSession();
    this.startPing();
  }

  private bootstrapSession(): void {
    if (this.mode === "legacy") {
      if (!this.legacySession) {
        this.emitError(
          new Error(
            "Legacy transport mode requires wsUsername and wsToken query params.",
          ),
        );
        return;
      }

      this.send(
        buildLegacyJoinOrRejoinMessage({
          gameID: this.gameID,
          username: this.legacySession.username,
          token: this.legacySession.token,
          clanTag: this.legacySession.clanTag,
          turnstileToken: this.legacySession.turnstileToken,
          lastTurn: this.legacySession.lastTurn,
        }),
      );
      return;
    }

    this.send({
      type: "client:subscribe",
      payload: {
        gameID: this.gameID,
      },
    });
  }

  private startPing(): void {
    if (this.pingInterval !== null) {
      return;
    }

    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 5_000);
  }

  private stopPing(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(payload: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(payload));
  }

  private closeSocket(): void {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.socket = null;
    socket.removeEventListener("message", this.handleMessage);
    socket.removeEventListener("error", this.handleSocketError);
    socket.removeEventListener("close", this.handleSocketClose);
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, "Client shutdown");
    }
  }

  private scheduleReconnect(): void {
    if (!this.reconnectEnabled || this.reconnectTimer !== null) {
      return;
    }

    this.reconnectAttempts += 1;
    const waitMs = Math.min(5_000, 500 * 2 ** (this.reconnectAttempts - 1));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unknown reconnect error.";
        this.emitError(new Error(`Reconnect failed: ${message}`));
        this.scheduleReconnect();
      });
    }, waitMs);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private readonly handleMessage = (event: MessageEvent<string>): void => {
    try {
      const parsed = parseServerMessage(JSON.parse(event.data));

      const errorText = extractServerErrorMessage(parsed);
      if (errorText) {
        this.emitError(new Error(errorText));
      }

      const turnEnvelope = toServerTurnEnvelope(parsed);
      if (!turnEnvelope) {
        return;
      }

      if (turnEnvelope.gameID && turnEnvelope.gameID !== this.gameID) {
        return;
      }

      for (const turn of turnEnvelope.turns) {
        this.turnListener?.(turn);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown transport message parse error.";
      this.emitError(new Error(`Invalid server message: ${message}`));
    }
  };

  private readonly handleSocketError = (): void => {
    this.emitError(new Error("Turn transport socket error."));
  };

  private readonly handleSocketClose = (event: CloseEvent): void => {
    this.stopPing();
    this.closeSocket();

    if (!this.reconnectEnabled) {
      return;
    }

    // Do not reconnect on normal closure from server.
    if (event.code === 1000) {
      return;
    }

    this.emitError(
      new Error(
        `Turn transport socket closed (code=${event.code}, reason=${event.reason || "n/a"}).`,
      ),
    );
    this.scheduleReconnect();
  };

  private emitError(error: Error): void {
    this.errorListener?.(error);
  }
}
