import { combatHandlers } from "./combatHandlers";
import { configurationHandlers } from "./configurationHandlers";
import { constructionHandlers } from "./constructionHandlers";
import { diplomacyHandlers } from "./diplomacyHandlers";
import { economyHandlers } from "./economyHandlers";
import { moderationHandlers } from "./moderationHandlers";
import { movementHandlers } from "./movementHandlers";
import { socialHandlers } from "./socialHandlers";
import type { HandlerMap } from "./types";

export const intentHandlers: HandlerMap = {
  ...combatHandlers,
  ...movementHandlers,
  ...diplomacyHandlers,
  ...economyHandlers,
  ...constructionHandlers,
  ...socialHandlers,
  ...moderationHandlers,
  ...configurationHandlers,
};
