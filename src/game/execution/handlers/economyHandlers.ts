import type { HandlerMap } from "./types";

type EconomyHandlerKeys = "donate_gold" | "donate_troops";

export const economyHandlers: Pick<HandlerMap, EconomyHandlerKeys> = {
  donate_gold: ({ store }, intent) => {
    store.recordEconomyAction();
    store.addDonatedGold(intent.gold);
  },
  donate_troops: ({ store }, intent) => {
    store.recordEconomyAction();
    store.addDonatedTroops(intent.troops);
  },
};
