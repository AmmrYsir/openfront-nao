import { describe, expect, test } from "bun:test";
import { IntentRuleValidator } from "../src/game/execution/IntentRuleValidator";
import { GameSessionStore } from "../src/game/state/GameSessionStore";
import type { StampedIntent } from "../src/game/contracts/turn";

function createStoreWithTerrain(terrain: Uint8Array, width: number, height: number) {
  const store = new GameSessionStore();
  store.setMapBootstrap(
    "World",
    "normal",
    "/legacy/resources/maps",
    {
      mapWidth: width,
      mapHeight: height,
      miniMapWidth: Math.max(1, Math.floor(width / 2)),
      miniMapHeight: Math.max(1, Math.floor(height / 2)),
    },
    0,
    terrain,
    {
      landComponentCount: 1,
      largestLandComponentSize: 1,
      waterComponentCount: 1,
      largestWaterComponentSize: 1,
      sampleWaterPathLength: null,
    },
  );
  return store;
}

describe("IntentRuleValidator", () => {
  test("enforces donate cooldown and allows after cooldown", () => {
    const validator = new IntentRuleValidator();
    const terrain = new Uint8Array([128, 128, 128, 128]);
    const store = createStoreWithTerrain(terrain, 2, 2);

    const intent: StampedIntent = {
      type: "donate_gold",
      recipient: "PLYR0002",
      gold: 10_000,
      clientID: "PLYR0001",
    };

    const first = validator.validate(intent, 100, store);
    expect(first.accepted).toBeTrue();

    const second = validator.validate(intent, 150, store);
    expect(second.accepted).toBeFalse();
    expect(second.reason).toBe("donate_gold_cooldown_active");

    const third = validator.validate(intent, 200, store);
    expect(third.accepted).toBeTrue();
  });

  test("rejects water spawn and land boat destination", () => {
    const validator = new IntentRuleValidator();
    // 0 and 3 are land, 1 and 2 are water
    const terrain = new Uint8Array([128, 0, 0, 128]);
    const store = createStoreWithTerrain(terrain, 2, 2);

    const spawnOnWater: StampedIntent = {
      type: "spawn",
      tile: 1,
      clientID: "PLYR0001",
    };
    const spawnResult = validator.validate(spawnOnWater, 1, store);
    expect(spawnResult.accepted).toBeFalse();
    expect(spawnResult.reason).toBe("spawn_not_on_land");

    const boatToLand: StampedIntent = {
      type: "boat",
      dst: 0,
      troops: 1000,
      clientID: "PLYR0001",
    };
    const boatResult = validator.validate(boatToLand, 1, store);
    expect(boatResult.accepted).toBeFalse();
    expect(boatResult.reason).toBe("boat_destination_not_water");
  });
});
