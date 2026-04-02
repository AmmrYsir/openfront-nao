import { createRequestId } from "../../utils/id";
import type { Turn } from "../contracts/turn";
import type { GameSessionSnapshot } from "../state/GameSessionStore";
import type { WorkerToMainMessage } from "./messages";

type PendingResolver = (message: WorkerToMainMessage) => void;

export interface GameWorkerClientOptions {
  onSnapshot?: (snapshot: GameSessionSnapshot) => void;
}

export class GameWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingResolver>();
  private onSnapshot?: (snapshot: GameSessionSnapshot) => void;
  private initialized = false;

  constructor(options: GameWorkerClientOptions = {}) {
    this.onSnapshot = options.onSnapshot;
    this.worker = new Worker(new URL("./GameSimulation.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.addEventListener("message", this.handleMessage);
  }

  async initialize(): Promise<GameSessionSnapshot> {
    const response = await this.request({
      type: "init",
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
    this.pending.clear();
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error("Worker client not initialized.");
    }
  }

  private request(
    message: { type: "init" } | { type: "get_snapshot" } | { type: "enqueue_turn"; turn: Turn },
  ): Promise<WorkerToMainMessage> {
    return new Promise<WorkerToMainMessage>((resolve) => {
      const id = createRequestId();
      this.pending.set(id, resolve);
      this.worker.postMessage({
        ...message,
        id,
      });
    });
  }

  private readonly handleMessage = (
    event: MessageEvent<WorkerToMainMessage>,
  ): void => {
    const message = event.data;

    if (message.type === "snapshot") {
      this.onSnapshot?.(message.snapshot);
    } else if (message.type === "initialized") {
      this.onSnapshot?.(message.snapshot);
    }

    if (message.id && this.pending.has(message.id)) {
      const resolver = this.pending.get(message.id);
      this.pending.delete(message.id);
      resolver?.(message);
    }
  };
}
