const IS_LAND_BIT = 7;
const OCEAN_BIT = 5;

export function isLandTerrainByte(value: number): boolean {
  return (value & (1 << IS_LAND_BIT)) !== 0;
}

export function isOceanTerrainByte(value: number): boolean {
  return (value & (1 << OCEAN_BIT)) !== 0;
}

export function isWaterTerrainByte(value: number): boolean {
  return !isLandTerrainByte(value);
}
