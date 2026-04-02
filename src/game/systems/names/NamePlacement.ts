export interface Cell {
  x: number;
  y: number;
}

export interface NamePlacement {
  x: number;
  y: number;
  size: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoundingBox {
  min: Cell;
  max: Cell;
}

export interface PlacementContext {
  isTileFillable: (cell: Cell) => boolean;
}

export function calculateBoundingBox(cells: readonly Cell[]): BoundingBox {
  if (cells.length === 0) {
    return {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
    };
  }

  let minX = cells[0].x;
  let minY = cells[0].y;
  let maxX = cells[0].x;
  let maxY = cells[0].y;
  for (const cell of cells) {
    if (cell.x < minX) minX = cell.x;
    if (cell.y < minY) minY = cell.y;
    if (cell.x > maxX) maxX = cell.x;
    if (cell.y > maxY) maxY = cell.y;
  }

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
  };
}

export function placeNameInTerritory(
  displayName: string,
  borderCells: readonly Cell[],
  context: PlacementContext,
): NamePlacement {
  const boundingBox = calculateBoundingBox(borderCells);
  const scalingFactor = chooseGridScale(boundingBox);
  const grid = createGrid(boundingBox, scalingFactor, context);
  const largestRectangle = findLargestInscribedRectangle(grid);

  const scaledRectangle: Rectangle = {
    x: largestRectangle.x * scalingFactor,
    y: largestRectangle.y * scalingFactor,
    width: largestRectangle.width * scalingFactor,
    height: largestRectangle.height * scalingFactor,
  };

  const center = {
    x: Math.floor(
      scaledRectangle.x + scaledRectangle.width / 2 + boundingBox.min.x,
    ),
    y: Math.floor(
      scaledRectangle.y + scaledRectangle.height / 2 + boundingBox.min.y,
    ),
  };

  const fontSize = calculateFontSize(scaledRectangle, displayName);
  return {
    x: Math.ceil(center.x),
    y: Math.ceil(center.y - fontSize / 3),
    size: fontSize,
  };
}

function chooseGridScale(boundingBox: BoundingBox): number {
  const width = boundingBox.max.x - boundingBox.min.x;
  const height = boundingBox.max.y - boundingBox.min.y;
  const size = Math.min(width, height);

  if (size < 25) return 1;
  if (size < 50) return 2;
  if (size < 100) return 4;
  if (size < 250) return 8;
  if (size < 500) return 16;
  return 32;
}

function createGrid(
  boundingBox: BoundingBox,
  scalingFactor: number,
  context: PlacementContext,
): boolean[][] {
  const scaledBoundingBox: BoundingBox = {
    min: {
      x: Math.floor(boundingBox.min.x / scalingFactor),
      y: Math.floor(boundingBox.min.y / scalingFactor),
    },
    max: {
      x: Math.floor(boundingBox.max.x / scalingFactor),
      y: Math.floor(boundingBox.max.y / scalingFactor),
    },
  };

  const width = scaledBoundingBox.max.x - scaledBoundingBox.min.x + 1;
  const height = scaledBoundingBox.max.y - scaledBoundingBox.min.y + 1;
  const grid: boolean[][] = Array.from({ length: width }, () =>
    Array.from({ length: height }, () => false),
  );

  for (let x = scaledBoundingBox.min.x; x <= scaledBoundingBox.max.x; x += 1) {
    for (
      let y = scaledBoundingBox.min.y;
      y <= scaledBoundingBox.max.y;
      y += 1
    ) {
      const cell = {
        x: x * scalingFactor,
        y: y * scalingFactor,
      };
      grid[x - scaledBoundingBox.min.x][y - scaledBoundingBox.min.y] =
        context.isTileFillable(cell);
    }
  }

  return grid;
}

function findLargestInscribedRectangle(grid: boolean[][]): Rectangle {
  const rows = grid[0]?.length ?? 0;
  const cols = grid.length;
  const heights = new Array<number>(cols).fill(0);
  let largestRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      heights[col] = grid[col][row] ? heights[col] + 1 : 0;
    }

    const rectForRow = largestRectangleInHistogram(heights);
    if (
      rectForRow.width * rectForRow.height >
      largestRect.width * largestRect.height
    ) {
      largestRect = {
        x: rectForRow.x,
        y: row - rectForRow.height + 1,
        width: rectForRow.width,
        height: rectForRow.height,
      };
    }
  }

  return largestRect;
}

function largestRectangleInHistogram(widths: readonly number[]): Rectangle {
  const stack: number[] = [];
  let maxArea = 0;
  let largestRect: Rectangle = { x: 0, y: 0, width: 0, height: 0 };

  for (let i = 0; i <= widths.length; i += 1) {
    const currentHeight = i === widths.length ? 0 : widths[i];
    while (
      stack.length > 0 &&
      currentHeight < widths[stack[stack.length - 1]]
    ) {
      const height = widths[stack.pop()!];
      const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;

      if (height * width > maxArea) {
        maxArea = height * width;
        largestRect = {
          x: stack.length === 0 ? 0 : stack[stack.length - 1] + 1,
          y: 0,
          width,
          height,
        };
      }
    }
    stack.push(i);
  }

  return largestRect;
}

function calculateFontSize(rectangle: Rectangle, displayName: string): number {
  const safeNameLength = Math.max(1, displayName.length);
  const widthConstrained = (rectangle.width / safeNameLength) * 2;
  const heightConstrained = rectangle.height / 3;
  return Math.min(widthConstrained, heightConstrained);
}
