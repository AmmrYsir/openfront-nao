import {
  LEGACY_MAPS_ROOT,
  legacyMapUrl,
} from "../../core/assets/legacyAssets";
import { analyzeConnectedComponents } from "../pathfinding/ConnectedComponents";
import { findShortestPathLength } from "../pathfinding/GridPathfinder";
import {
  isLandTerrainByte,
  isWaterTerrainByte,
} from "../pathfinding/TerrainBits";
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
  terrainData: Uint8Array;
  landComponentCount: number;
  largestLandComponentSize: number;
  waterComponentCount: number;
  largestWaterComponentSize: number;
  sampleWaterPathLength: number | null;
}

function createLegacyMapLoader(): FetchGameMapLoader {
  return new FetchGameMapLoader((path) => legacyMapUrl(path));
}

export async function bootstrapMapRuntime(
  config: MapRuntimeConfig,
): Promise<MapBootstrapSnapshot> {
  const mapLoader = createLegacyMapLoader();
  const terrainMap = await loadTerrainMap(config.mapId, config.mapSize, mapLoader);
  const terrainData = terrainMap.gameMap.data;
  const width = terrainMap.gameMap.width;
  const height = terrainMap.gameMap.height;

  const landConnectivity = analyzeConnectedComponents(
    terrainData,
    width,
    height,
    isLandTerrainByte,
  );
  const waterConnectivity = analyzeConnectedComponents(
    terrainData,
    width,
    height,
    isWaterTerrainByte,
  );

  const firstWaterTile = terrainData.findIndex((value) => isWaterTerrainByte(value));
  const lastWaterTile = (() => {
    for (let i = terrainData.length - 1; i >= 0; i -= 1) {
      if (isWaterTerrainByte(terrainData[i])) {
        return i;
      }
    }
    return -1;
  })();

  const sampleWaterPathLength =
    firstWaterTile >= 0 && lastWaterTile >= 0
      ? findShortestPathLength(
          terrainData,
          width,
          height,
          firstWaterTile,
          lastWaterTile,
          isWaterTerrainByte,
        )
      : null;

  return {
    mapId: config.mapId,
    mapSize: config.mapSize,
    mapSourcePath: `/${LEGACY_MAPS_ROOT}`,
    mapWidth: terrainMap.gameMap.width,
    mapHeight: terrainMap.gameMap.height,
    miniMapWidth: terrainMap.miniGameMap.width,
    miniMapHeight: terrainMap.miniGameMap.height,
    nationCount: terrainMap.nations.length,
    terrainData,
    landComponentCount: landConnectivity.componentCount,
    largestLandComponentSize: landConnectivity.largestComponentSize,
    waterComponentCount: waterConnectivity.componentCount,
    largestWaterComponentSize: waterConnectivity.largestComponentSize,
    sampleWaterPathLength,
  };
}
