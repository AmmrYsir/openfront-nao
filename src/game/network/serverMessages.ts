import { z } from "zod";
import { TurnSchema } from "../contracts/intentSchemas";
import type { Turn } from "../contracts/turn";

const serverTurnPayloadSchema = z.object({
  gameID: z.string().min(1),
  turn: TurnSchema,
});

const serverSnapshotRequestSchema = z.object({
  gameID: z.string().min(1),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("server:turn"),
    payload: serverTurnPayloadSchema,
  }),
  z.object({
    type: z.literal("server:sync"),
    payload: serverSnapshotRequestSchema,
  }),
  z.object({
    type: z.literal("server:error"),
    payload: z.object({
      code: z.string().min(1),
      message: z.string().min(1),
    }),
  }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export interface ServerTurnEnvelope {
  gameID: string;
  turn: Turn;
}

export function parseServerMessage(raw: unknown): ServerMessage {
  return serverMessageSchema.parse(raw);
}

export function toServerTurnEnvelope(message: ServerMessage): ServerTurnEnvelope | null {
  if (message.type !== "server:turn") {
    return null;
  }

  return {
    gameID: message.payload.gameID,
    turn: message.payload.turn,
  };
}
