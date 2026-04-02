import { z } from "zod";
import type { RuntimeServerConfig } from "../config/RuntimeServerConfig";

const MatchAssignmentSchema = z.object({
  type: z.literal("match-assignment"),
  gameId: z.string(),
});

export function parseMatchAssignment(payload: unknown): string | null {
  const result = MatchAssignmentSchema.safeParse(payload);
  if (!result.success) {
    return null;
  }
  return result.data.gameId;
}

export interface MatchmakingClientOptions {
  config: RuntimeServerConfig;
  tokenProvider: () => Promise<string>;
  onGameAssigned: (gameID: string) => void;
  fetcher?: typeof fetch;
  websocketFactory?: (url: string) => WebSocket;
  joinDelayMs?: number;
}

function defaultWebSocketFactory(url: string): WebSocket {
  return new WebSocket(url);
}

export class MatchmakingClient {
  private readonly config: RuntimeServerConfig;
  private readonly tokenProvider: () => Promise<string>;
  private readonly onGameAssigned: (gameID: string) => void;
  private readonly fetcher: typeof fetch;
  private readonly websocketFactory: (url: string) => WebSocket;
  private readonly joinDelayMs: number;

  private socket: WebSocket | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: MatchmakingClientOptions) {
    this.config = options.config;
    this.tokenProvider = options.tokenProvider;
    this.onGameAssigned = options.onGameAssigned;
    this.fetcher = options.fetcher ?? fetch;
    this.websocketFactory = options.websocketFactory ?? defaultWebSocketFactory;
    this.joinDelayMs = options.joinDelayMs ?? 2000;
  }

  async open(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("MatchmakingClient requires browser window context.");
    }

    const instanceId = await this.getInstanceId();
    const issuer = this.config.jwtIssuer();
    const wsUrl = `${issuer.replace(/^http/, "ws")}/matchmaking/join?instance_id=${encodeURIComponent(instanceId)}`;

    this.socket = this.websocketFactory(wsUrl);
    this.socket.addEventListener("open", () => {
      this.connectTimeout = setTimeout(() => {
        void this.sendJoinPacket();
      }, this.joinDelayMs);
    });
    this.socket.addEventListener("message", (event) => {
      this.handleMessage(event);
    });
  }

  close(): void {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  async pollGameReady(gameID: string): Promise<boolean> {
    const workerPath = this.config.workerPath(gameID);
    const response = await this.fetcher(`${workerPath}/api/game/${gameID}/exists`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return false;
    }

    const body = (await response.json()) as { exists?: unknown };
    return body.exists === true;
  }

  private async sendJoinPacket(): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const jwt = await this.tokenProvider();
    this.socket.send(
      JSON.stringify({
        type: "join",
        jwt,
      }),
    );
  }

  private handleMessage(event: MessageEvent): void {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(String(event.data));
    } catch {
      return;
    }

    const gameId = parseMatchAssignment(parsedJson);
    if (!gameId) {
      return;
    }

    this.onGameAssigned(gameId);
  }

  private async getInstanceId(): Promise<string> {
    const response = await this.fetcher("/api/instance", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to resolve matchmaking instance ID: ${response.status}`,
      );
    }

    const body = (await response.json()) as { instanceId?: unknown };
    if (typeof body.instanceId !== "string" || body.instanceId.length === 0) {
      throw new Error("Missing instanceId from /api/instance.");
    }
    return body.instanceId;
  }
}
