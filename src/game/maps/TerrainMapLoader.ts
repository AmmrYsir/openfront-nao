import type {
  GameMapLoader,
  MapId,
  MapMetadata,
  Nation,
  TeamGameSpawnAreas,
} from "./GameMapLoader";

export type MapSize = "normal" | "compact";

export interface TerrainGrid {
  width: number;
  height: number;
  numLandTiles: number;
  data: Uint8Array;
}

export interface TerrainMapData {
  nations: Nation[];
  gameMap: TerrainGrid;
  miniGameMap: TerrainGrid;
  teamGameSpawnAreas?: TeamGameSpawnAreas;
}

const loadedMaps = new Map<string, TerrainMapData>();

export async function loadTerrainMap(
  mapId: MapId,
  mapSize: MapSize,
  loader: GameMapLoader,
): Promise<TerrainMapData> {
  const cacheKey = `${mapId}:${mapSize}`;
  const cached = loadedMaps.get(cacheKey);
  if (cached) {
    return cached;
  }

  const mapFiles = loader.getMapData(mapId);
  const manifest = await mapFiles.manifest();

  const gameMap =
    mapSize === "normal"
      ? await createTerrainGrid(manifest.map, await mapFiles.mapBin())
      : await createTerrainGrid(manifest.map4x, await mapFiles.map4xBin());

  const miniGameMap =
    mapSize === "normal"
      ? await createTerrainGrid(manifest.map4x, await mapFiles.map4xBin())
      : await createTerrainGrid(manifest.map16x, await mapFiles.map16xBin());

  const scaledNations =
    mapSize === "compact"
      ? manifest.nations.map((nation) => ({
          ...nation,
          coordinates: [
            Math.floor(nation.coordinates[0] / 2),
            Math.floor(nation.coordinates[1] / 2),
          ] as [number, number],
        }))
      : manifest.nations;

  const scaledSpawnAreas =
    mapSize === "compact"
      ? scaleSpawnAreasForCompactMap(manifest.teamGameSpawnAreas)
      : manifest.teamGameSpawnAreas;

  const result: TerrainMapData = {
    nations: scaledNations,
    gameMap,
    miniGameMap,
    teamGameSpawnAreas: scaledSpawnAreas,
  };

  loadedMaps.set(cacheKey, result);
  return result;
}

function scaleSpawnAreasForCompactMap(
  spawnAreas: TeamGameSpawnAreas | undefined,
): TeamGameSpawnAreas | undefined {
  if (!spawnAreas) {
    return undefined;
  }

  const scaled: TeamGameSpawnAreas = {};
  for (const [team, areas] of Object.entries(spawnAreas)) {
    scaled[team] = areas.map((area) => ({
      x: Math.floor(area.x / 2),
      y: Math.floor(area.y / 2),
      width: Math.max(1, Math.floor(area.width / 2)),
      height: Math.max(1, Math.floor(area.height / 2)),
    }));
  }

  return scaled;
}

async function createTerrainGrid(
  metadata: MapMetadata,
  data: Uint8Array,
): Promise<TerrainGrid> {
  const expectedLength = metadata.width * metadata.height;
  if (data.length !== expectedLength) {
    throw new Error(
      `Invalid terrain map buffer length ${data.length}. Expected ${expectedLength}.`,
    );
  }

  return {
    width: metadata.width,
    height: metadata.height,
    numLandTiles: metadata.num_land_tiles,
    data,
  };
}
