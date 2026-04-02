import { describe, expect, test } from "bun:test";
import { SimulationWorld } from "../src/game/simulation/SimulationWorld";

function createTerrain(): Uint8Array {
  // 3x3: land on all but center tile.
  return new Uint8Array([
    128, 128, 128,
    128, 0, 128,
    128, 128, 128,
  ]);
}

describe("SimulationWorld", () => {
  test("spawns players on land and resolves attack transfers", () => {
    const world = new SimulationWorld();
    world.initializeTerrain(createTerrain());

    world.spawn("PLYR_A", 0);
    world.spawn("PLYR_B", 2);
    world.attack("PLYR_A", "PLYR_B", 20_000);

    const summary = world.getSummary();
    expect(summary.activePlayerCount).toBe(1);
    expect(summary.eliminatedPlayerCount).toBe(1);
    expect(summary.battlesResolved).toBe(1);
    expect(summary.territoryTransfers).toBe(1);
  });

  test("supports donation and economy snapshots", () => {
    const world = new SimulationWorld();
    world.initializeTerrain(createTerrain());
    world.spawn("PLYR_A", 0);
    world.spawn("PLYR_B", 2);

    world.donateGold("PLYR_A", "PLYR_B", 10_000);
    world.donateTroops("PLYR_A", "PLYR_B", 5_000);

    const players = world.getPlayerSnapshots();
    const playerA = players.find((player) => player.id === "PLYR_A");
    const playerB = players.find((player) => player.id === "PLYR_B");

    expect(playerA).toBeDefined();
    expect(playerB).toBeDefined();
    expect(playerA?.donatedGold).toBe(10_000);
    expect(playerB?.receivedGold).toBe(10_000);
    expect(playerA?.donatedTroops).toBe(5_000);
    expect(playerB?.receivedTroops).toBe(5_000);
  });
});
