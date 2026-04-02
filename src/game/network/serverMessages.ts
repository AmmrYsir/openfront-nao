import { z } from "zod";
import { IntentSchema, TurnSchema } from "../contracts/intentSchemas";
import type { Turn } from "../contracts/turn";

const modernServerTurnPayloadSchema = z.object({
  gameID: z.string().min(1),
  turn: TurnSchema,
});

const modernServerSnapshotRequestSchema = z.object({
  gameID: z.string().min(1),
});

const modernServerMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("server:turn"),
    payload: modernServerTurnPayloadSchema,
  }),
  z.object({
    type: z.literal("server:sync"),
    payload: modernServerSnapshotRequestSchema,
  }),
  z.object({
    type: z.literal("server:error"),
    payload: z.object({
      code: z.string().min(1),
      message: z.string().min(1),
    }),
  }),
]);

const legacyServerTurnMessageSchema = z.object({
  type: z.literal("turn"),
  turn: TurnSchema,
});

const legacyServerStartMessageSchema = z.object({
  type: z.literal("start"),
  turns: TurnSchema.array(),
  gameStartInfo: z.unknown(),
  lobbyCreatedAt: z.number(),
  myClientID: z.string().optional(),
});

const legacyServerPrestartMessageSchema = z.object({
  type: z.literal("prestart"),
  gameMap: z.string(),
  gameMapSize: z.string(),
});

const legacyServerPingMessageSchema = z.object({
  type: z.literal("ping"),
});

const legacyServerDesyncMessageSchema = z.object({
  type: z.literal("desync"),
  turn: z.number(),
  correctHash: z.number().nullable(),
  clientsWithCorrectHash: z.number(),
  totalActiveClients: z.number(),
  yourHash: z.number().optional(),
});

const legacyServerErrorMessageSchema = z.object({
  type: z.literal("error"),
  error: z.string(),
  message: z.string().optional(),
});

const legacyServerLobbyInfoMessageSchema = z.object({
  type: z.literal("lobby_info"),
  lobby: z.unknown(),
  myClientID: z.string(),
});

const legacyServerMessageSchema = z.discriminatedUnion("type", [
  legacyServerTurnMessageSchema,
  legacyServerStartMessageSchema,
  legacyServerPrestartMessageSchema,
  legacyServerPingMessageSchema,
  legacyServerDesyncMessageSchema,
  legacyServerErrorMessageSchema,
  legacyServerLobbyInfoMessageSchema,
]);

export const serverMessageSchema = z.union([
  modernServerMessageSchema,
  legacyServerMessageSchema,
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export type LegacyServerMessage = z.infer<typeof legacyServerMessageSchema>;

export interface ServerTurnEnvelope {
  gameID: string | null;
  turns: Turn[];
}

const legacyClientIntentMessageSchema = z.object({
  type: z.literal("intent"),
  intent: IntentSchema,
});

const legacyClientPingMessageSchema = z.object({
  type: z.literal("ping"),
});

const legacyClientJoinMessageSchema = z.object({
  type: z.literal("join"),
  gameID: z.string().min(1),
  username: z.string().min(1),
  clanTag: z.string().nullable(),
  cosmetics: z.unknown().optional(),
  turnstileToken: z.string().nullable(),
  token: z.string().min(1),
});

const legacyClientRejoinMessageSchema = z.object({
  type: z.literal("rejoin"),
  gameID: z.string().min(1),
  lastTurn: z.number().nonnegative(),
  token: z.string().min(1),
});

export const legacyClientMessageSchema = z.discriminatedUnion("type", [
  legacyClientIntentMessageSchema,
  legacyClientPingMessageSchema,
  legacyClientJoinMessageSchema,
  legacyClientRejoinMessageSchema,
]);

export type LegacyClientMessage = z.infer<typeof legacyClientMessageSchema>;

export interface LegacyClientJoinPayload {
  gameID: string;
  username: string;
  token: string;
  clanTag?: string | null;
  turnstileToken?: string | null;
  lastTurn?: number;
}

export function parseServerMessage(raw: unknown): ServerMessage {
  return serverMessageSchema.parse(raw);
}

export function buildLegacyJoinOrRejoinMessage(
  payload: LegacyClientJoinPayload,
): LegacyClientMessage {
  if (payload.lastTurn !== undefined) {
    return legacyClientRejoinMessageSchema.parse({
      type: "rejoin",
      gameID: payload.gameID,
      lastTurn: payload.lastTurn,
      token: payload.token,
    });
  }

  return legacyClientJoinMessageSchema.parse({
    type: "join",
    gameID: payload.gameID,
    username: payload.username,
    clanTag: payload.clanTag ?? null,
    turnstileToken: payload.turnstileToken ?? null,
    token: payload.token,
  });
}

export function buildLegacyPingMessage(): LegacyClientMessage {
  return legacyClientPingMessageSchema.parse({
    type: "ping",
  });
}

export function buildLegacyIntentMessage(
  intent: z.input<typeof IntentSchema>,
): LegacyClientMessage {
  return legacyClientIntentMessageSchema.parse({
    type: "intent",
    intent,
  });
}

export function toServerTurnEnvelope(
  message: ServerMessage,
): ServerTurnEnvelope | null {
  if (message.type === "server:turn") {
    return {
      gameID: message.payload.gameID,
      turns: [message.payload.turn],
    };
  }

  if (message.type === "turn") {
    return {
      gameID: null,
      turns: [message.turn],
    };
  }

  if (message.type === "start") {
    return {
      gameID: null,
      turns: message.turns,
    };
  }

  return null;
}

export function extractServerErrorMessage(message: ServerMessage): string | null {
  if (message.type === "server:error") {
    return `[${message.payload.code}] ${message.payload.message}`;
  }

  if (message.type === "error") {
    return message.message ?? message.error;
  }

  return null;
}
