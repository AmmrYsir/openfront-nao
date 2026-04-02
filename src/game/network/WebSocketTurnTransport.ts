import { parseServerMessage, toServerTurnEnvelope } from "./serverMessages";
import type { TurnTransport } from "./TurnTransport";

interface WebSocketTurnTransportOptions {
  url: string;
  gameID: string;
}

export class WebSocketTurnTransport implements TurnTransport {
  private readonly url: string;
  private readonly gameID: string;
  private socket: WebSocket | null = null;
  private turnListener?: (turn: import("../contracts/turn").Turn) => void;
  private errorListener?: (error: Error) => void;

  constructor(options: WebSocketTurnTransportOptions) {
    this.url = options.url;
    this.gameID = options.gameID;
  }

  async connect(): Promise<void> {
    if (this.socket !== null) {
      return;
    }

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
    this.send({
      type: "client:subscribe",
      payload: {
        gameID: this.gameID,
      },
    });
  }

  disconnect(): void {
    if (this.socket === null) {
      return;
    }

    const socket = this.socket;
    this.socket = null;
    socket.removeEventListener("message", this.handleMessage);
    socket.removeEventListener("error", this.handleSocketError);
    socket.removeEventListener("close", this.handleSocketClose);
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000, "Client shutdown");
    }
  }

  setTurnListener(listener?: (turn: import("../contracts/turn").Turn) => void): void {
    this.turnListener = listener;
  }

  setErrorListener(listener?: (error: Error) => void): void {
    this.errorListener = listener;
  }

  private send(payload: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(payload));
  }

  private readonly handleMessage = (event: MessageEvent<string>): void => {
    try {
      const parsed = parseServerMessage(JSON.parse(event.data));
      const turnEnvelope = toServerTurnEnvelope(parsed);
      if (!turnEnvelope) {
        if (parsed.type === "server:error") {
          this.emitError(
            new Error(`[${parsed.payload.code}] ${parsed.payload.message}`),
          );
        }
        return;
      }

      if (turnEnvelope.gameID !== this.gameID) {
        return;
      }

      this.turnListener?.(turnEnvelope.turn);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown transport message error.";
      this.emitError(new Error(`Invalid server message: ${message}`));
    }
  };

  private readonly handleSocketError = (): void => {
    this.emitError(new Error("Turn transport socket error."));
  };

  private readonly handleSocketClose = (): void => {
    this.emitError(new Error("Turn transport socket closed."));
    this.disconnect();
  };

  private emitError(error: Error): void {
    this.errorListener?.(error);
  }
}
