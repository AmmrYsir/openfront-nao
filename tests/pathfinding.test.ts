import { describe, expect, test } from "bun:test";
import { analyzeConnectedComponents } from "../src/game/pathfinding/ConnectedComponents";
import { findShortestPathLength } from "../src/game/pathfinding/GridPathfinder";
import {
  isLandTerrainByte,
  isWaterTerrainByte,
} from "../src/game/pathfinding/TerrainBits";

describe("Pathfinding Foundations", () => {
  test("analyzes connected land components", () => {
    // 3x3 terrain. Land(128) forms two components.
    const terrain = new Uint8Array([
      128, 128, 0,
      0, 0, 0,
      128, 0, 128,
    ]);

    const result = analyzeConnectedComponents(terrain, 3, 3, isLandTerrainByte);
    expect(result.componentCount).toBe(3);
    expect(result.largestComponentSize).toBe(2);
    expect(result.passableTileCount).toBe(4);
  });

  test("finds shortest path through water tiles", () => {
    const terrain = new Uint8Array([
      128, 0, 0,
      128, 0, 128,
      128, 0, 128,
    ]);

    const length = findShortestPathLength(
      terrain,
      3,
      3,
      1,
      7,
      isWaterTerrainByte,
    );
    expect(length).toBe(2);
  });
});
