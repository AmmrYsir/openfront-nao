import {
  LEGACY_MAPS_ROOT,
  legacyMapUrl,
} from "../../core/assets/legacyAssets";
import { FetchGameMapLoader } from "./FetchGameMapLoader";
import type { MapRuntimeConfig } from "./MapRuntimeConfig";
import { loadTerrainMap } from "./TerrainMapLoader";

export interface MapBootstrapSnapshot {
  mapId: string;
  mapSize: string;
  mapSourcePath: string;
  mapWidth: number;
  mapHeight: number;
  miniMapWidth: number;
  miniMapHeight: number;
  nationCount: number;
}

function createLegacyMapLoader(): FetchGameMapLoader {
  return new FetchGameMapLoader((path) => legacyMapUrl(path));
}

export async function bootstrapMapRuntime(
  config: MapRuntimeConfig,
): Promise<MapBootstrapSnapshot> {
  const mapLoader = createLegacyMapLoader();
  const terrainMap = await loadTerrainMap(config.mapId, config.mapSize, mapLoader);

  return {
    mapId: config.mapId,
    mapSize: config.mapSize,
    mapSourcePath: `/${LEGACY_MAPS_ROOT}`,
    mapWidth: terrainMap.gameMap.width,
    mapHeight: terrainMap.gameMap.height,
    miniMapWidth: terrainMap.miniGameMap.width,
    miniMapHeight: terrainMap.miniGameMap.height,
    nationCount: terrainMap.nations.length,
  };
}
