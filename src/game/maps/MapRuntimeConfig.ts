import type { MapId } from "./GameMapLoader";
import type { MapSize } from "./TerrainMapLoader";

export interface MapRuntimeConfig {
  mapId: MapId;
  mapSize: MapSize;
}

export const DEFAULT_MAP_RUNTIME_CONFIG: MapRuntimeConfig = {
  mapId: "World",
  mapSize: "normal",
};
