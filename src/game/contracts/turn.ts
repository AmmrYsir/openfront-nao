export type ClientId = string;
export type PlayerId = string;
export type TileRef = number;

export const ALL_PLAYERS = "AllPlayers" as const;

export type UnitType =
  | "Transport"
  | "Warship"
  | "Shell"
  | "SAMMissile"
  | "Port"
  | "Atom Bomb"
  | "Hydrogen Bomb"
  | "Trade Ship"
  | "Missile Silo"
  | "Defense Post"
  | "SAM Launcher"
  | "City"
  | "MIRV"
  | "MIRV Warhead"
  | "Train"
  | "Factory";

export type EmbargoAction = "start" | "stop";

export interface AttackIntent {
  type: "attack";
  targetID: PlayerId | null;
  troops: number | null;
}

export interface CancelAttackIntent {
  type: "cancel_attack";
  attackID: string;
}

export interface SpawnIntent {
  type: "spawn";
  tile: TileRef;
}

export interface BoatAttackIntent {
  type: "boat";
  troops: number;
  dst: TileRef;
}

export interface CancelBoatIntent {
  type: "cancel_boat";
  unitID: number;
}

export interface AllianceRequestIntent {
  type: "allianceRequest";
  recipient: PlayerId;
}

export interface AllianceRejectIntent {
  type: "allianceReject";
  requestor: PlayerId;
}

export interface BreakAllianceIntent {
  type: "breakAlliance";
  recipient: PlayerId;
}

export interface TargetPlayerIntent {
  type: "targetPlayer";
  target: PlayerId;
}

export interface EmojiIntent {
  type: "emoji";
  recipient: PlayerId | typeof ALL_PLAYERS;
  emoji: number;
}

export interface DonateGoldIntent {
  type: "donate_gold";
  recipient: PlayerId;
  gold: number | null;
}

export interface DonateTroopsIntent {
  type: "donate_troops";
  recipient: PlayerId;
  troops: number | null;
}

export interface BuildUnitIntent {
  type: "build_unit";
  unit: UnitType;
  tile: TileRef;
  rocketDirectionUp?: boolean;
}

export interface UpgradeStructureIntent {
  type: "upgrade_structure";
  unit: UnitType;
  unitId: number;
}

export interface EmbargoIntent {
  type: "embargo";
  targetID: PlayerId;
  action: EmbargoAction;
}

export interface EmbargoAllIntent {
  type: "embargo_all";
  action: EmbargoAction;
}

export interface MoveWarshipIntent {
  type: "move_warship";
  unitId: number;
  tile: TileRef;
}

export interface QuickChatIntent {
  type: "quick_chat";
  recipient: PlayerId;
  quickChatKey: string;
  target?: PlayerId;
}

export interface AllianceExtensionIntent {
  type: "allianceExtension";
  recipient: PlayerId;
}

export interface DeleteUnitIntent {
  type: "delete_unit";
  unitId: number;
}

export interface KickPlayerIntent {
  type: "kick_player";
  target: PlayerId;
}

export interface TogglePauseIntent {
  type: "toggle_pause";
  paused: boolean;
}

export interface UpdateGameConfigIntent {
  type: "update_game_config";
  config: Record<string, unknown>;
}

export interface MarkDisconnectedIntent {
  type: "mark_disconnected";
  clientID: ClientId;
  isDisconnected: boolean;
}

export type Intent =
  | AttackIntent
  | CancelAttackIntent
  | SpawnIntent
  | BoatAttackIntent
  | CancelBoatIntent
  | AllianceRequestIntent
  | AllianceRejectIntent
  | BreakAllianceIntent
  | TargetPlayerIntent
  | EmojiIntent
  | DonateGoldIntent
  | DonateTroopsIntent
  | BuildUnitIntent
  | UpgradeStructureIntent
  | EmbargoIntent
  | EmbargoAllIntent
  | MoveWarshipIntent
  | QuickChatIntent
  | AllianceExtensionIntent
  | DeleteUnitIntent
  | KickPlayerIntent
  | TogglePauseIntent
  | UpdateGameConfigIntent
  | MarkDisconnectedIntent;

export type StampedIntent = Intent & { clientID: ClientId };

export interface Turn {
  turnNumber: number;
  intents: StampedIntent[];
  hash?: number | null;
}

export function createSampleTurn(
  turnNumber: number,
  clientID: ClientId,
): Turn {
  return {
    turnNumber,
    hash: null,
    intents: [
      {
        type: "toggle_pause",
        paused: false,
        clientID,
      },
      {
        type: "spawn",
        tile: turnNumber * 7,
        clientID,
      },
    ],
  };
}
