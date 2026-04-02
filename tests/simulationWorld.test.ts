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

  test("applies turn lifecycle economy and declares winner after spawn phase", () => {
    const world = new SimulationWorld();
    world.initializeTerrain(createTerrain());

    world.spawn("PLYR_A", 0);
    world.spawn("PLYR_A", 1);
    world.spawn("PLYR_A", 2);
    world.spawn("PLYR_A", 3);
    world.spawn("PLYR_A", 5);
    world.spawn("PLYR_A", 6);
    world.spawn("PLYR_A", 7);
    world.spawn("PLYR_A", 8);

    world.processTurn(301);

    const summary = world.getSummary();
    const player = world
      .getPlayerSnapshots()
      .find((entry) => entry.id === "PLYR_A");

    expect(summary.inSpawnPhase).toBe(false);
    expect(summary.currentTurn).toBe(301);
    expect(summary.winnerPlayerId).toBe("PLYR_A");
    expect(summary.winnerDeclaredTurn).toBe(301);
    expect(summary.topTerritoryControlPercentage).toBeGreaterThan(80);
    expect(player).toBeDefined();
    expect(player?.gold).toBeGreaterThan(60_000);
    expect(player?.troops).toBeGreaterThan(90_000);
  });

  test("tracks unit lifecycle for build, upgrade, delete, and warship movement", () => {
    const world = new SimulationWorld();
    world.initializeTerrain(createTerrain());
    world.spawn("PLYR_A", 0);

    world.buildUnit("PLYR_A", "City");
    world.buildUnit("PLYR_A", "Warship");
    world.moveWarship("PLYR_A", 12, 2);
    world.upgradeStructure("PLYR_A", 12, "Warship");
    world.deleteUnit("PLYR_A", 12);

    const summary = world.getSummary();
    const player = world
      .getPlayerSnapshots()
      .find((entry) => entry.id === "PLYR_A");

    expect(summary.activeUnitCount).toBe(2);
    expect(summary.deletedUnitCount).toBe(1);
    expect(summary.upgradedUnitCount).toBe(1);
    expect(summary.warshipMoveCount).toBe(1);
    expect(player).toBeDefined();
    expect(player?.builtUnitTotal).toBe(2);
    expect(player?.upgradedUnits).toBe(1);
    expect(player?.deletedUnits).toBe(1);
    expect(player?.movedWarships).toBe(1);
  });
});
