export type MapId = string;

export interface MapMetadata {
  width: number;
  height: number;
  num_land_tiles: number;
}

export interface SpawnArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TeamGameSpawnAreas = Record<string, SpawnArea[]>;

export interface Nation {
  coordinates: [number, number];
  flag: string;
  name: string;
}

export interface MapManifest {
  name: string;
  map: MapMetadata;
  map4x: MapMetadata;
  map16x: MapMetadata;
  nations: Nation[];
  teamGameSpawnAreas?: TeamGameSpawnAreas;
}

export interface MapData {
  mapBin: () => Promise<Uint8Array>;
  map4xBin: () => Promise<Uint8Array>;
  map16xBin: () => Promise<Uint8Array>;
  manifest: () => Promise<MapManifest>;
  webpPath: string;
}

export interface GameMapLoader {
  getMapData(mapId: MapId): MapData;
}
