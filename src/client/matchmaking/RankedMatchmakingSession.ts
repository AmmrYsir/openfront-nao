import type { RuntimeServerConfig } from "../config/RuntimeServerConfig";
import { MatchmakingClient } from "./MatchmakingClient";

interface PlayTokenProvider {
  getPlayToken(): Promise<string>;
}

export interface RankedMatchmakingSessionOptions {
  config: RuntimeServerConfig;
  authClient: PlayTokenProvider;
  onStatus?: (status: string) => void;
  onAssigned?: (gameID: string) => void;
  onReady?: (gameID: string) => void;
  pollIntervalMs?: number;
  matchmakingClientFactory?: (options: {
    config: RuntimeServerConfig;
    tokenProvider: () => Promise<string>;
    onGameAssigned: (gameID: string) => void;
  }) => {
    open: () => Promise<void>;
    close: () => void;
    pollGameReady: (gameID: string) => Promise<boolean>;
  };
}

export class RankedMatchmakingSession {
  private readonly config: RuntimeServerConfig;
  private readonly authClient: PlayTokenProvider;
  private readonly onStatus?: (status: string) => void;
  private readonly onAssigned?: (gameID: string) => void;
  private readonly onReady?: (gameID: string) => void;
  private readonly pollIntervalMs: number;
  private readonly matchmakingClientFactory: NonNullable<
    RankedMatchmakingSessionOptions["matchmakingClientFactory"]
  >;

  private client: {
    open: () => Promise<void>;
    close: () => void;
    pollGameReady: (gameID: string) => Promise<boolean>;
  } | null = null;
  private assignedGameID: string | null = null;
  private readyPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: RankedMatchmakingSessionOptions) {
    this.config = options.config;
    this.authClient = options.authClient;
    this.onStatus = options.onStatus;
    this.onAssigned = options.onAssigned;
    this.onReady = options.onReady;
    this.pollIntervalMs = options.pollIntervalMs ?? 1000;
    this.matchmakingClientFactory =
      options.matchmakingClientFactory ??
      ((clientOptions) => new MatchmakingClient(clientOptions));
  }

  async start(): Promise<void> {
    if (this.client) {
      this.pushStatus("Matchmaking already active.");
      return;
    }

    this.pushStatus("Connecting to ranked matchmaking...");
    this.client = this.matchmakingClientFactory({
      config: this.config,
      tokenProvider: async () => this.authClient.getPlayToken(),
      onGameAssigned: (gameID) => {
        this.assignedGameID = gameID;
        this.onAssigned?.(gameID);
        this.pushStatus(`Match found: ${gameID}. Waiting for game readiness...`);
        this.startReadyPolling();
      },
    });

    try {
      await this.client.open();
      this.pushStatus("Queued in ranked matchmaking.");
    } catch (error) {
      this.pushStatus(
        `Failed to connect matchmaking: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      this.stop();
    }
  }

  stop(): void {
    this.client?.close();
    this.client = null;
    this.assignedGameID = null;

    if (this.readyPollTimer) {
      clearInterval(this.readyPollTimer);
      this.readyPollTimer = null;
    }

    this.pushStatus("Matchmaking stopped.");
  }

  private startReadyPolling(): void {
    if (!this.client || !this.assignedGameID) {
      return;
    }

    if (this.readyPollTimer) {
      clearInterval(this.readyPollTimer);
      this.readyPollTimer = null;
    }

    this.readyPollTimer = setInterval(() => {
      void this.pollGameReadiness();
    }, this.pollIntervalMs);
  }

  private async pollGameReadiness(): Promise<void> {
    if (!this.client || !this.assignedGameID) {
      return;
    }

    const gameID = this.assignedGameID;
    const ready = await this.client.pollGameReady(gameID);
    if (!ready) {
      return;
    }

    if (this.readyPollTimer) {
      clearInterval(this.readyPollTimer);
      this.readyPollTimer = null;
    }

    this.pushStatus(`Game ${gameID} is ready.`);
    this.onReady?.(gameID);
  }

  private pushStatus(status: string): void {
    this.onStatus?.(status);
  }
}
