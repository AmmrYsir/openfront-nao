export interface ComponentAnalysisResult {
  componentCount: number;
  largestComponentSize: number;
  passableTileCount: number;
}

function forEachNeighbor(
  tile: number,
  width: number,
  height: number,
  callback: (neighbor: number) => void,
): void {
  const x = tile % width;
  const y = Math.floor(tile / width);

  if (y > 0) {
    callback(tile - width);
  }
  if (y + 1 < height) {
    callback(tile + width);
  }
  if (x > 0) {
    callback(tile - 1);
  }
  if (x + 1 < width) {
    callback(tile + 1);
  }
}

export function analyzeConnectedComponents(
  terrainData: Uint8Array,
  width: number,
  height: number,
  isPassable: (terrainByte: number) => boolean,
): ComponentAnalysisResult {
  const tileCount = width * height;
  if (terrainData.length !== tileCount) {
    throw new Error(
      `Invalid terrainData length ${terrainData.length}; expected ${tileCount}.`,
    );
  }

  const visited = new Uint8Array(tileCount);
  const queue = new Uint32Array(tileCount);

  let componentCount = 0;
  let largestComponentSize = 0;
  let passableTileCount = 0;

  for (let tile = 0; tile < tileCount; tile += 1) {
    if (!isPassable(terrainData[tile])) {
      continue;
    }

    passableTileCount += 1;
    if (visited[tile] === 1) {
      continue;
    }

    componentCount += 1;
    visited[tile] = 1;

    let head = 0;
    let tail = 0;
    queue[tail] = tile;
    tail += 1;

    let currentComponentSize = 0;
    while (head < tail) {
      const current = queue[head];
      head += 1;
      currentComponentSize += 1;

      forEachNeighbor(current, width, height, (neighbor) => {
        if (visited[neighbor] === 1) {
          return;
        }
        if (!isPassable(terrainData[neighbor])) {
          return;
        }
        visited[neighbor] = 1;
        queue[tail] = neighbor;
        tail += 1;
      });
    }

    if (currentComponentSize > largestComponentSize) {
      largestComponentSize = currentComponentSize;
    }
  }

  return {
    componentCount,
    largestComponentSize,
    passableTileCount,
  };
}
