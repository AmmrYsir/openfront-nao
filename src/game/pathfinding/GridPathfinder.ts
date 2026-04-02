interface Point {
  x: number;
  y: number;
}

function tileToPoint(tile: number, width: number): Point {
  return {
    x: tile % width,
    y: Math.floor(tile / width),
  };
}

function pointToTile(x: number, y: number, width: number): number {
  return y * width + x;
}

function isValidTile(tile: number, width: number, height: number): boolean {
  return Number.isInteger(tile) && tile >= 0 && tile < width * height;
}

function forEachNeighbor(
  tile: number,
  width: number,
  height: number,
  callback: (neighbor: number) => void,
): void {
  const { x, y } = tileToPoint(tile, width);

  if (y > 0) {
    callback(pointToTile(x, y - 1, width));
  }
  if (y + 1 < height) {
    callback(pointToTile(x, y + 1, width));
  }
  if (x > 0) {
    callback(pointToTile(x - 1, y, width));
  }
  if (x + 1 < width) {
    callback(pointToTile(x + 1, y, width));
  }
}

export function findShortestPathLength(
  terrainData: Uint8Array,
  width: number,
  height: number,
  fromTile: number,
  toTile: number,
  canTraverse: (terrainByte: number) => boolean,
): number | null {
  if (!isValidTile(fromTile, width, height) || !isValidTile(toTile, width, height)) {
    return null;
  }
  if (!canTraverse(terrainData[fromTile]) || !canTraverse(terrainData[toTile])) {
    return null;
  }
  if (fromTile === toTile) {
    return 0;
  }

  const tileCount = width * height;
  const distance = new Int32Array(tileCount);
  distance.fill(-1);

  const queue = new Uint32Array(tileCount);
  let head = 0;
  let tail = 0;

  distance[fromTile] = 0;
  queue[tail] = fromTile;
  tail += 1;

  while (head < tail) {
    const tile = queue[head];
    head += 1;
    const currentDistance = distance[tile];

    forEachNeighbor(tile, width, height, (neighbor) => {
      if (distance[neighbor] >= 0) {
        return;
      }
      if (!canTraverse(terrainData[neighbor])) {
        return;
      }

      distance[neighbor] = currentDistance + 1;
      if (neighbor === toTile) {
        return;
      }

      queue[tail] = neighbor;
      tail += 1;
    });

    if (distance[toTile] >= 0) {
      break;
    }
  }

  return distance[toTile] >= 0 ? distance[toTile] : null;
}
