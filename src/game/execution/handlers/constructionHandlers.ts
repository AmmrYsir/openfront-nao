import type { HandlerMap } from "./types";

type ConstructionHandlerKeys =
  | "build_unit"
  | "upgrade_structure"
  | "delete_unit";

export const constructionHandlers: Pick<HandlerMap, ConstructionHandlerKeys> = {
  build_unit: ({ store }, intent) => {
    store.recordConstructionAction();
    store.incrementBuiltUnit(intent.clientID, intent.unit);
  },
  upgrade_structure: ({ store }, intent) => {
    store.recordConstructionAction();
    store.recordUpgradeStructure(intent.clientID, intent.unitId, intent.unit);
  },
  delete_unit: ({ store }, intent) => {
    store.recordConstructionAction();
    store.recordDeleteUnit(intent.clientID, intent.unitId);
  },
};
