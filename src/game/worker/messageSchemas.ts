import { z } from "zod";
import { TurnSchema } from "../contracts/intentSchemas";
import { MapSizeSchema } from "../maps/MapRuntimeConfig";

const mapRuntimeConfigSchema = z.object({
  mapId: z.string().min(1),
  mapSize: MapSizeSchema,
});

export const mainToWorkerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("init"),
    id: z.string().optional(),
    mapConfig: mapRuntimeConfigSchema,
  }),
  z.object({
    type: z.literal("enqueue_turn"),
    id: z.string().optional(),
    turn: TurnSchema,
  }),
  z.object({
    type: z.literal("get_snapshot"),
    id: z.string().optional(),
  }),
]);

export const workerToMainMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("initialized"),
    id: z.string().optional(),
    snapshot: z.unknown(),
  }),
  z.object({
    type: z.literal("snapshot"),
    id: z.string().optional(),
    snapshot: z.unknown(),
  }),
  z.object({
    type: z.literal("ack"),
    id: z.string().optional(),
    ok: z.literal(true),
  }),
]);

export function parseMainToWorkerMessage(input: unknown) {
  return mainToWorkerMessageSchema.parse(input);
}

export function parseWorkerToMainMessage(input: unknown) {
  return workerToMainMessageSchema.parse(input);
}
