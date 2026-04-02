import type { HandlerMap } from "./types";

type ModerationHandlerKeys = "kick_player" | "mark_disconnected";

export const moderationHandlers: Pick<HandlerMap, ModerationHandlerKeys> = {
  kick_player: ({ store }) => {
    store.recordModerationAction();
  },
  mark_disconnected: ({ store }, intent) => {
    store.recordModerationAction();
    store.setPlayerDisconnected(intent.clientID, intent.isDisconnected);
  },
};
