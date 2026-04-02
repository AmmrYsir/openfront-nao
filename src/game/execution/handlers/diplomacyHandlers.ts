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
  allianceRequest: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.recordAllianceRequest(intent.clientID, intent.recipient);
  },
  allianceReject: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.recordAllianceReject(intent.requestor, intent.clientID);
  },
  breakAlliance: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.recordBreakAlliance(intent.clientID, intent.recipient);
  },
  allianceExtension: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.recordAllianceExtension(intent.clientID, intent.recipient);
  },
  targetPlayer: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.setTargetPlayer(intent.clientID, intent.target);
  },
  embargo: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.setEmbargo(
      intent.clientID,
      intent.targetID,
      intent.action === "start",
    );
  },
  embargo_all: ({ store }, intent) => {
    store.recordDiplomacyAction();
    store.setEmbargo(intent.clientID, "__all__", intent.action === "start");
  },
};
