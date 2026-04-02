import type { HandlerMap } from "./types";

type MovementHandlerKeys = "move_warship" | "spawn";

export const movementHandlers: Pick<HandlerMap, MovementHandlerKeys> = {
  move_warship: ({ store }) => {
    store.recordMovementAction();
  },
  spawn: ({ store }, intent) => {
    store.recordMovementAction();
    store.markSpawn(intent.tile);
  },
};
