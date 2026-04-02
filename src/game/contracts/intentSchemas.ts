import { z } from "zod";
import { ALL_PLAYERS } from "./turn";

const GAME_ID_REGEX = /^[A-Za-z0-9]{8}$/;

export const IdSchema = z.string().regex(GAME_ID_REGEX);

export const UnitTypeSchema = z.enum([
  "Transport",
  "Warship",
  "Shell",
  "SAMMissile",
  "Port",
  "Atom Bomb",
  "Hydrogen Bomb",
  "Trade Ship",
  "Missile Silo",
  "Defense Post",
  "SAM Launcher",
  "City",
  "MIRV",
  "MIRV Warhead",
  "Train",
  "Factory",
]);

export const AttackIntentSchema = z.object({
  type: z.literal("attack"),
  targetID: IdSchema.nullable(),
  troops: z.number().nonnegative().nullable(),
});

export const CancelAttackIntentSchema = z.object({
  type: z.literal("cancel_attack"),
  attackID: z.string(),
});

export const SpawnIntentSchema = z.object({
  type: z.literal("spawn"),
  tile: z.number(),
});

export const BoatAttackIntentSchema = z.object({
  type: z.literal("boat"),
  troops: z.number().nonnegative(),
  dst: z.number(),
});

export const CancelBoatIntentSchema = z.object({
  type: z.literal("cancel_boat"),
  unitID: z.number(),
});

export const AllianceRequestIntentSchema = z.object({
  type: z.literal("allianceRequest"),
  recipient: IdSchema,
});

export const AllianceRejectIntentSchema = z.object({
  type: z.literal("allianceReject"),
  requestor: IdSchema,
});

export const BreakAllianceIntentSchema = z.object({
  type: z.literal("breakAlliance"),
  recipient: IdSchema,
});

export const TargetPlayerIntentSchema = z.object({
  type: z.literal("targetPlayer"),
  target: IdSchema,
});

export const EmojiIntentSchema = z.object({
  type: z.literal("emoji"),
  recipient: z.union([IdSchema, z.literal(ALL_PLAYERS)]),
  emoji: z.number().nonnegative(),
});

export const DonateGoldIntentSchema = z.object({
  type: z.literal("donate_gold"),
  recipient: IdSchema,
  gold: z.number().nonnegative().nullable(),
});

export const DonateTroopsIntentSchema = z.object({
  type: z.literal("donate_troops"),
  recipient: IdSchema,
  troops: z.number().nonnegative().nullable(),
});

export const BuildUnitIntentSchema = z.object({
  type: z.literal("build_unit"),
  unit: UnitTypeSchema,
  tile: z.number(),
  rocketDirectionUp: z.boolean().optional(),
});

export const UpgradeStructureIntentSchema = z.object({
  type: z.literal("upgrade_structure"),
  unit: UnitTypeSchema,
  unitId: z.number(),
});

export const EmbargoIntentSchema = z.object({
  type: z.literal("embargo"),
  targetID: IdSchema,
  action: z.union([z.literal("start"), z.literal("stop")]),
});

export const EmbargoAllIntentSchema = z.object({
  type: z.literal("embargo_all"),
  action: z.union([z.literal("start"), z.literal("stop")]),
});

export const MoveWarshipIntentSchema = z.object({
  type: z.literal("move_warship"),
  unitId: z.number(),
  tile: z.number(),
});

export const QuickChatIntentSchema = z.object({
  type: z.literal("quick_chat"),
  recipient: IdSchema,
  quickChatKey: z.string(),
  target: IdSchema.optional(),
});

export const AllianceExtensionIntentSchema = z.object({
  type: z.literal("allianceExtension"),
  recipient: IdSchema,
});

export const DeleteUnitIntentSchema = z.object({
  type: z.literal("delete_unit"),
  unitId: z.number(),
});

export const KickPlayerIntentSchema = z.object({
  type: z.literal("kick_player"),
  target: IdSchema,
});

export const TogglePauseIntentSchema = z.object({
  type: z.literal("toggle_pause"),
  paused: z.boolean().default(false),
});

export const UpdateGameConfigIntentSchema = z.object({
  type: z.literal("update_game_config"),
  config: z.record(z.string(), z.unknown()),
});

export const MarkDisconnectedIntentSchema = z.object({
  type: z.literal("mark_disconnected"),
  clientID: IdSchema,
  isDisconnected: z.boolean(),
});

export const IntentSchema = z.discriminatedUnion("type", [
  AttackIntentSchema,
  CancelAttackIntentSchema,
  SpawnIntentSchema,
  BoatAttackIntentSchema,
  CancelBoatIntentSchema,
  AllianceRequestIntentSchema,
  AllianceRejectIntentSchema,
  BreakAllianceIntentSchema,
  TargetPlayerIntentSchema,
  EmojiIntentSchema,
  DonateGoldIntentSchema,
  DonateTroopsIntentSchema,
  BuildUnitIntentSchema,
  UpgradeStructureIntentSchema,
  EmbargoIntentSchema,
  EmbargoAllIntentSchema,
  MoveWarshipIntentSchema,
  QuickChatIntentSchema,
  AllianceExtensionIntentSchema,
  DeleteUnitIntentSchema,
  KickPlayerIntentSchema,
  TogglePauseIntentSchema,
  UpdateGameConfigIntentSchema,
  MarkDisconnectedIntentSchema,
]);

export const StampedIntentSchema = IntentSchema.and(
  z.object({
    clientID: IdSchema,
  }),
);

export const TurnSchema = z.object({
  turnNumber: z.number(),
  intents: StampedIntentSchema.array(),
  hash: z.number().nullable().optional(),
});

export type ParsedTurn = z.infer<typeof TurnSchema>;

export function parseTurn(input: unknown): ParsedTurn {
  return TurnSchema.parse(input);
}
