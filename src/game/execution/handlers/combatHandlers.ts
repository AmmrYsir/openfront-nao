import type { HandlerMap } from "./types";

type CombatHandlerKeys = "attack" | "cancel_attack" | "boat" | "cancel_boat";

export const combatHandlers: Pick<HandlerMap, CombatHandlerKeys> = {
  attack: ({ store }, intent) => {
    store.recordCombatAction();
    store.recordAttack(intent.clientID, intent.targetID, intent.troops);
  },
  cancel_attack: ({ store }) => {
    store.recordCombatAction();
    store.recordCancelAttack();
  },
  boat: ({ store }, intent) => {
    store.recordCombatAction();
    store.recordBoatAttack(intent.clientID, intent.troops);
  },
  cancel_boat: ({ store }) => {
    store.recordCombatAction();
    store.recordCancelBoat();
  },
};
