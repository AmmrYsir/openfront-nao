import type { SimulationClient } from "../../core/ports/SimulationClient";
import { createRequestId } from "../../utils/id";
import type { Turn } from "../contracts/turn";
import {
  DEFAULT_MAP_RUNTIME_CONFIG,
  type MapRuntimeConfig,
} from "../maps/MapRuntimeConfig";
import type { GameSessionSnapshot } from "../state/GameSessionStore";
import type { WorkerToMainMessage } from "./messages";
import { parseWorkerToMainMessage } from "./messageSchemas";

interface PendingRequest {
  resolve: (message: WorkerToMainMessage) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export interface GameWorkerClientOptions {
  onSnapshot?: (snapshot: GameSessionSnapshot) => void;
  mapConfig?: MapRuntimeConfig;
}

export class GameWorkerClient implements SimulationClient {
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingRequest>();
  private onSnapshot?: (snapshot: GameSessionSnapshot) => void;
  private readonly mapConfig: MapRuntimeConfig;
  private initialized = false;

  constructor(options: GameWorkerClientOptions = {}) {
    this.onSnapshot = options.onSnapshot;
    this.mapConfig = options.mapConfig ?? DEFAULT_MAP_RUNTIME_CONFIG;
    this.worker = new Worker(new URL("./GameSimulation.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.addEventListener("message", this.handleMessage);
  }

  async initialize(): Promise<GameSessionSnapshot> {
    const response = await this.request({
      type: "init",
      mapConfig: this.mapConfig,
    });

    if (response.type !== "initialized") {
      throw new Error(`Unexpected init response: ${response.type}`);
    }

    this.initialized = true;
    this.onSnapshot?.(response.snapshot);
    return response.snapshot;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async enqueueTurn(turn: Turn): Promise<void> {
    this.assertInitialized();
    const response = await this.request({
      type: "enqueue_turn",
      turn,
    });

    if (response.type !== "ack") {
      throw new Error(`Unexpected enqueue response: ${response.type}`);
    }
  }

  async getSnapshot(): Promise<GameSessionSnapshot> {
    this.assertInitialized();
    const response = await this.request({
      type: "get_snapshot",
    });

    if (response.type !== "snapshot") {
      throw new Error(`Unexpected snapshot response: ${response.type}`);
    }

    return response.snapshot;
  }

  setSnapshotListener(listener?: (snapshot: GameSessionSnapshot) => void): void {
    this.onSnapshot = listener;
  }

  dispose(): void {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.terminate();
    for (const pendingRequest of this.pending.values()) {
      clearTimeout(pendingRequest.timeout);
      pendingRequest.reject(
        new Error("Worker disposed before request completed."),
      );
    }
    this.pending.clear();
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error("Worker client not initialized.");
    }
  }

  private request(
    message:
      | { type: "init"; mapConfig: MapRuntimeConfig }
      | { type: "get_snapshot" }
      | { type: "enqueue_turn"; turn: Turn },
  ): Promise<WorkerToMainMessage> {
    return new Promise<WorkerToMainMessage>((resolve, reject) => {
      const id = createRequestId();
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Worker request timed out: ${message.type}`));
      }, 8000);

      this.pending.set(id, { resolve, reject, timeout });
      this.worker.postMessage({
        ...message,
        id,
      });
    });
  }

  private readonly handleMessage = (
    event: MessageEvent<unknown>,
  ): void => {
    let message: WorkerToMainMessage;
    try {
      const parsed = parseWorkerToMainMessage(event.data);
      message = parsed as WorkerToMainMessage;
    } catch (error: unknown) {
      const text =
        error instanceof Error ? error.message : "Unknown worker message parse error.";
      console.error(`Dropped invalid worker message: ${text}`);
      return;
    }

    if (message.type === "snapshot") {
      this.onSnapshot?.(message.snapshot);
    } else if (message.type === "initialized") {
      this.onSnapshot?.(message.snapshot);
    }

    if (message.id && this.pending.has(message.id)) {
      const pendingRequest = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        pendingRequest.resolve(message);
      }
    }
  };
}
