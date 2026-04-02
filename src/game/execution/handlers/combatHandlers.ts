import type { HandlerMap } from "./types";

type CombatHandlerKeys = "attack" | "cancel_attack" | "boat" | "cancel_boat";

export const combatHandlers: Pick<HandlerMap, CombatHandlerKeys> = {
  attack: ({ store }) => {
    store.recordCombatAction();
  },
  cancel_attack: ({ store }) => {
    store.recordCombatAction();
  },
  boat: ({ store }) => {
    store.recordCombatAction();
  },
  cancel_boat: ({ store }) => {
    store.recordCombatAction();
  },
};
