import type { HandlerMap } from "./types";

type SocialHandlerKeys = "emoji" | "quick_chat";

export const socialHandlers: Pick<HandlerMap, SocialHandlerKeys> = {
  emoji: ({ store }) => {
    store.recordSocialAction();
  },
  quick_chat: ({ store }) => {
    store.recordSocialAction();
  },
};
