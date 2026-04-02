import type { HandlerMap } from "./types";

type ConfigurationHandlerKeys = "toggle_pause" | "update_game_config";

export const configurationHandlers: Pick<HandlerMap, ConfigurationHandlerKeys> =
  {
    toggle_pause: ({ store }, intent) => {
      store.recordConfigurationAction();
      store.setPaused(intent.paused);
    },
    update_game_config: ({ store }, intent) => {
      store.recordConfigurationAction();
      store.setLastConfigPatchSize(Object.keys(intent.config).length);
    },
  };
