import { LEGACY_SIMULATION_RULES } from "../config/legacySimulationRules";
import type { StampedIntent } from "../contracts/turn";
import type { GameSessionStore } from "../state/GameSessionStore";

export interface IntentValidationResult {
  accepted: boolean;
  reason: string | null;
}

export class IntentRuleValidator {
  private readonly lastDonationTickByClient = new Map<string, number>();
  private readonly lastEmojiTickByClient = new Map<string, number>();
  private readonly lastEmbargoAllTickByClient = new Map<string, number>();
  private readonly lastDeleteUnitTickByClient = new Map<string, number>();

  validate(
    intent: StampedIntent,
    turnNumber: number,
    store: GameSessionStore,
  ): IntentValidationResult {
    switch (intent.type) {
      case "attack":
        if (intent.troops === null || intent.troops <= 0) {
          return this.rejected("attack_troops_non_positive");
        }
        if (intent.targetID === intent.clientID) {
          return this.rejected("attack_self_target");
        }
        return this.accepted();

      case "boat":
        if (intent.troops <= 0) {
          return this.rejected("boat_troops_non_positive");
        }
        if (!store.isMapTileValid(intent.dst)) {
          return this.rejected("boat_invalid_destination_tile");
        }
        if (store.isLandTile(intent.dst) === true) {
          return this.rejected("boat_destination_not_water");
        }
        return this.accepted();

      case "spawn":
        if (!store.isMapTileValid(intent.tile)) {
          return this.rejected("spawn_invalid_tile");
        }
        if (store.isLandTile(intent.tile) === false) {
          return this.rejected("spawn_not_on_land");
        }
        return this.accepted();

      case "allianceRequest":
        if (intent.recipient === intent.clientID) {
          return this.rejected("alliance_request_self");
        }
        return this.accepted();

      case "allianceReject":
        if (intent.requestor === intent.clientID) {
          return this.rejected("alliance_reject_self");
        }
        return this.accepted();

      case "breakAlliance":
        if (intent.recipient === intent.clientID) {
          return this.rejected("break_alliance_self");
        }
        return this.accepted();

      case "allianceExtension":
        if (intent.recipient === intent.clientID) {
          return this.rejected("alliance_extension_self");
        }
        return this.accepted();

      case "targetPlayer":
        if (intent.target === intent.clientID) {
          return this.rejected("target_player_self");
        }
        return this.accepted();

      case "donate_gold":
        if (intent.recipient === intent.clientID) {
          return this.rejected("donate_gold_self");
        }
        if (intent.gold === null || intent.gold <= 0) {
          return this.rejected("donate_gold_non_positive");
        }
        if (
          !this.isCooldownReady(
            this.lastDonationTickByClient,
            intent.clientID,
            turnNumber,
            LEGACY_SIMULATION_RULES.donateCooldownTicks,
          )
        ) {
          return this.rejected("donate_gold_cooldown_active");
        }
        this.lastDonationTickByClient.set(intent.clientID, turnNumber);
        return this.accepted();

      case "donate_troops":
        if (intent.recipient === intent.clientID) {
          return this.rejected("donate_troops_self");
        }
        if (intent.troops === null || intent.troops <= 0) {
          return this.rejected("donate_troops_non_positive");
        }
        if (
          !this.isCooldownReady(
            this.lastDonationTickByClient,
            intent.clientID,
            turnNumber,
            LEGACY_SIMULATION_RULES.donateCooldownTicks,
          )
        ) {
          return this.rejected("donate_troops_cooldown_active");
        }
        this.lastDonationTickByClient.set(intent.clientID, turnNumber);
        return this.accepted();

      case "emoji":
        if (
          intent.recipient !== "AllPlayers" &&
          intent.recipient === intent.clientID
        ) {
          return this.rejected("emoji_self");
        }
        if (
          !this.isCooldownReady(
            this.lastEmojiTickByClient,
            intent.clientID,
            turnNumber,
            LEGACY_SIMULATION_RULES.emojiMessageCooldownTicks,
          )
        ) {
          return this.rejected("emoji_cooldown_active");
        }
        this.lastEmojiTickByClient.set(intent.clientID, turnNumber);
        return this.accepted();

      case "embargo_all":
        if (
          !this.isCooldownReady(
            this.lastEmbargoAllTickByClient,
            intent.clientID,
            turnNumber,
            LEGACY_SIMULATION_RULES.embargoAllCooldownTicks,
          )
        ) {
          return this.rejected("embargo_all_cooldown_active");
        }
        this.lastEmbargoAllTickByClient.set(intent.clientID, turnNumber);
        return this.accepted();

      case "delete_unit":
        if (
          !this.isCooldownReady(
            this.lastDeleteUnitTickByClient,
            intent.clientID,
            turnNumber,
            LEGACY_SIMULATION_RULES.deleteUnitCooldownTicks,
          )
        ) {
          return this.rejected("delete_unit_cooldown_active");
        }
        this.lastDeleteUnitTickByClient.set(intent.clientID, turnNumber);
        return this.accepted();

      case "move_warship":
        if (!store.isMapTileValid(intent.tile)) {
          return this.rejected("move_warship_invalid_tile");
        }
        if (store.isLandTile(intent.tile) === true) {
          return this.rejected("move_warship_not_on_water");
        }
        return this.accepted();

      case "build_unit":
        if (!store.isMapTileValid(intent.tile)) {
          return this.rejected("build_unit_invalid_tile");
        }
        if (store.isLandTile(intent.tile) === false) {
          return this.rejected("build_unit_not_on_land");
        }
        return this.accepted();

      default:
        return this.accepted();
    }
  }

  private isCooldownReady(
    lastTickMap: Map<string, number>,
    clientID: string,
    currentTurn: number,
    cooldownTicks: number,
  ): boolean {
    const lastTick = lastTickMap.get(clientID);
    if (lastTick === undefined) {
      return true;
    }
    return currentTurn - lastTick >= cooldownTicks;
  }

  private accepted(): IntentValidationResult {
    return {
      accepted: true,
      reason: null,
    };
  }

  private rejected(reason: string): IntentValidationResult {
    return {
      accepted: false,
      reason,
    };
  }
}
