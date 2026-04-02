import type { HandlerMap } from "./types";

type DiplomacyHandlerKeys =
  | "allianceRequest"
  | "allianceReject"
  | "breakAlliance"
  | "allianceExtension"
  | "targetPlayer"
  | "embargo"
  | "embargo_all";

export const diplomacyHandlers: Pick<HandlerMap, DiplomacyHandlerKeys> = {
  allianceRequest: ({ store }) => {
    store.recordDiplomacyAction();
  },
  allianceReject: ({ store }) => {
    store.recordDiplomacyAction();
  },
  breakAlliance: ({ store }) => {
    store.recordDiplomacyAction();
  },
  allianceExtension: ({ store }) => {
    store.recordDiplomacyAction();
  },
  targetPlayer: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.setTargetPlayer(intent.target);
  },
  embargo: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.setEmbargo(intent.targetID, intent.action === "start");
  },
  embargo_all: ({ store }, intent) => {
    store.recordDiplomacyAction();
    // `embargo_all` applies globally in legacy flow. Here we track intent activity.
    store.setEmbargo("__all__", intent.action === "start");
  },
};
