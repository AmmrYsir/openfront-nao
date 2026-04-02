import type { HandlerMap } from "./types";

type MovementHandlerKeys = "move_warship" | "spawn";

export const movementHandlers: Pick<HandlerMap, MovementHandlerKeys> = {
  move_warship: ({ store }, intent) => {
    store.recordMovementAction();
    store.recordMoveWarship(intent.clientID, intent.unitId, intent.tile);
  },
  spawn: ({ store }, intent) => {
    store.recordMovementAction();
    store.markSpawn(intent.clientID, intent.tile);
  },
};
