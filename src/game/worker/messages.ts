import type { Turn } from "../contracts/turn";
import type { MapRuntimeConfig } from "../maps/MapRuntimeConfig";
import type { GameSessionSnapshot } from "../state/GameSessionStore";

export type WorkerRequestType = "init" | "enqueue_turn" | "get_snapshot";
export type WorkerEventType = "initialized" | "snapshot" | "ack";

interface BaseMessage {
  id?: string;
}

export interface InitRequest extends BaseMessage {
  type: "init";
  mapConfig: MapRuntimeConfig;
}

export interface EnqueueTurnRequest extends BaseMessage {
  type: "enqueue_turn";
  turn: Turn;
}

export interface GetSnapshotRequest extends BaseMessage {
  type: "get_snapshot";
}

export interface InitializedEvent extends BaseMessage {
  type: "initialized";
  snapshot: GameSessionSnapshot;
}

export interface SnapshotEvent extends BaseMessage {
  type: "snapshot";
  snapshot: GameSessionSnapshot;
}

export interface AckEvent extends BaseMessage {
  type: "ack";
  ok: true;
}

export type MainToWorkerMessage =
  | InitRequest
  | EnqueueTurnRequest
  | GetSnapshotRequest;

export type WorkerToMainMessage = InitializedEvent | SnapshotEvent | AckEvent;
