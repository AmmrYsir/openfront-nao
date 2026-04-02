import { assetUrl } from "./assetUrl";

export const LEGACY_ASSET_ROOT = "legacy";
export const LEGACY_RESOURCES_ROOT = `${LEGACY_ASSET_ROOT}/resources`;
export const LEGACY_PROPRIETARY_ROOT = `${LEGACY_ASSET_ROOT}/proprietary`;
export const LEGACY_MAPS_ROOT = `${LEGACY_RESOURCES_ROOT}/maps`;

export function legacyResourceUrl(path: string): string {
  return assetUrl(`${LEGACY_RESOURCES_ROOT}/${path}`);
}

export function legacyProprietaryUrl(path: string): string {
  return assetUrl(`${LEGACY_PROPRIETARY_ROOT}/${path}`);
}

export function legacyMapUrl(path: string): string {
  return assetUrl(`${LEGACY_MAPS_ROOT}/${path}`);
}
