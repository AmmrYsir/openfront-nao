import type { GameMapLoader, MapData, MapId, MapManifest } from "./GameMapLoader";

export class FetchGameMapLoader implements GameMapLoader {
  private readonly maps = new Map<MapId, MapData>();
  private readonly pathResolver: string | ((path: string) => string);

  constructor(pathResolver: string | ((path: string) => string)) {
    this.pathResolver = pathResolver;
  }

  getMapData(mapId: MapId): MapData {
    const cached = this.maps.get(mapId);
    if (cached) {
      return cached;
    }

    const fileName = mapId.toLowerCase().replace(/[\s.]+/g, "");
    const mapData: MapData = {
      mapBin: () => this.loadBinaryFromUrl(this.url(fileName, "map.bin")),
      map4xBin: () => this.loadBinaryFromUrl(this.url(fileName, "map4x.bin")),
      map16xBin: () =>
        this.loadBinaryFromUrl(this.url(fileName, "map16x.bin")),
      manifest: () =>
        this.loadJsonFromUrl<MapManifest>(this.url(fileName, "manifest.json")),
      webpPath: this.url(fileName, "thumbnail.webp"),
    };

    this.maps.set(mapId, mapData);
    return mapData;
  }

  private resolveUrl(path: string): string {
    if (typeof this.pathResolver === "function") {
      return this.pathResolver(path);
    }
    return `${this.pathResolver}/${path}`;
  }

  private url(map: string, fileName: string): string {
    return this.resolveUrl(`${map}/${fileName}`);
  }

  private async loadBinaryFromUrl(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }

    const data = await response.arrayBuffer();
    return new Uint8Array(data);
  }

  private async loadJsonFromUrl<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}
