import { DEFAULT_MAP_RUNTIME_CONFIG, type MapRuntimeConfig } from "./MapRuntimeConfig";

export function resolveMapConfigFromSearchParams(
  params: URLSearchParams,
): MapRuntimeConfig {
  const mapId = params.get("map") ?? DEFAULT_MAP_RUNTIME_CONFIG.mapId;
  const compactRequested = params.get("compact");

  return {
    mapId,
    mapSize:
      compactRequested === "1" || compactRequested === "true"
        ? "compact"
        : DEFAULT_MAP_RUNTIME_CONFIG.mapSize,
  };
}
