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
  const peerA: PlayerId = "PLYR0001";
  const peerB: PlayerId = "PLYR0002";
  const peerC: PlayerId = "PLYR0003";
  const cyclicalTile = (turnNumber * 7) % 5000;

  const scriptedIntents: StampedIntent[] =
    turnNumber % 4 === 1
      ? [
          { type: "toggle_pause", paused: turnNumber % 8 === 1, clientID },
          { type: "spawn", tile: cyclicalTile, clientID },
          { type: "attack", targetID: peerA, troops: 30_000, clientID },
          { type: "boat", dst: cyclicalTile + 2, troops: 12_000, clientID },
          {
            type: "build_unit",
            unit: "City",
            tile: cyclicalTile + 1,
            clientID,
          },
          { type: "donate_gold", recipient: peerB, gold: 25_000, clientID },
          { type: "emoji", recipient: peerC, emoji: 3, clientID },
        ]
      : turnNumber % 4 === 2
        ? [
            { type: "allianceRequest", recipient: peerA, clientID },
            { type: "targetPlayer", target: peerB, clientID },
            { type: "embargo", targetID: peerC, action: "start", clientID },
            {
              type: "quick_chat",
              recipient: peerA,
              quickChatKey: "diplomacy.greeting",
              clientID,
            },
            {
              type: "update_game_config",
              config: { donateGold: false, disableAlliances: false },
              clientID,
            },
            { type: "move_warship", unitId: 12, tile: cyclicalTile + 20, clientID },
          ]
        : turnNumber % 4 === 3
          ? [
              { type: "allianceExtension", recipient: peerA, clientID },
              { type: "donate_troops", recipient: peerB, troops: 7_500, clientID },
              { type: "upgrade_structure", unit: "City", unitId: 99, clientID },
              { type: "delete_unit", unitId: 77, clientID },
              { type: "cancel_attack", attackID: `atk-${turnNumber}`, clientID },
              { type: "cancel_boat", unitID: 18, clientID },
            ]
          : [
              { type: "allianceReject", requestor: peerA, clientID },
              { type: "breakAlliance", recipient: peerB, clientID },
              { type: "embargo_all", action: "stop", clientID },
              { type: "kick_player", target: peerC, clientID },
              {
                type: "mark_disconnected",
                clientID: peerC,
                isDisconnected: turnNumber % 8 === 0,
              },
            ];

  return {
    turnNumber,
    hash: null,
    intents: scriptedIntents,
  };
}
