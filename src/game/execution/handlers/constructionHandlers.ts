import type { HandlerMap } from "./types";

type ConstructionHandlerKeys =
  | "build_unit"
  | "upgrade_structure"
  | "delete_unit";

export const constructionHandlers: Pick<HandlerMap, ConstructionHandlerKeys> = {
  build_unit: ({ store }, intent) => {
    store.recordConstructionAction();
    store.incrementBuiltUnit(intent.unit);
  },
  upgrade_structure: ({ store }) => {
    store.recordConstructionAction();
  },
  delete_unit: ({ store }) => {
    store.recordConstructionAction();
  },
};
