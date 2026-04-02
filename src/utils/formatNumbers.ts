export function renderNumber(
  num: number | bigint,
  fixedPoints?: number,
): string {
  let normalized = Number(num);
  normalized = Math.max(normalized, 0);

  if (normalized >= 10_000_000) {
    const value = Math.floor(normalized / 100000) / 10;
    return `${value.toFixed(fixedPoints ?? 1)}M`;
  }
  if (normalized >= 1_000_000) {
    const value = Math.floor(normalized / 10000) / 100;
    return `${value.toFixed(fixedPoints ?? 2)}M`;
  }
  if (normalized >= 100000) {
    return `${Math.floor(normalized / 1000)}K`;
  }
  if (normalized >= 10000) {
    const value = Math.floor(normalized / 100) / 10;
    return `${value.toFixed(fixedPoints ?? 1)}K`;
  }
  if (normalized >= 1000) {
    const value = Math.floor(normalized / 10) / 100;
    return `${value.toFixed(fixedPoints ?? 2)}K`;
  }

  return Math.floor(normalized).toString();
}

export function renderTroops(troops: number): string {
  return renderNumber(troops / 10);
}
