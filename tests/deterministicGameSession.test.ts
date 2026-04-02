import { describe, expect, test } from "bun:test";
import { DeterministicGameSession } from "../src/server/DeterministicGameSession";
import type { Turn } from "../src/game/contracts/turn";

function terrain(): Uint8Array {
  return new Uint8Array([
    128, 128, 128,
    128, 0, 128,
    128, 128, 128,
  ]);
}

describe("DeterministicGameSession", () => {
  test("applies migrated turns into authoritative snapshot state", () => {
    const session = new DeterministicGameSession();
    session.initialize({
      mapId: "test-map",
      mapSize: "small",
      sourcePath: "/public/legacy/resources/maps/test-map/map.bin",
      dimensions: {
        mapWidth: 3,
        mapHeight: 3,
        miniMapWidth: 3,
        miniMapHeight: 3,
      },
      nationCount: 0,
      terrainData: terrain(),
      terrainMetrics: {
        landComponentCount: 1,
        largestLandComponentSize: 8,
        waterComponentCount: 1,
        largestWaterComponentSize: 1,
        sampleWaterPathLength: null,
      },
    });

    const turn: Turn = {
      turnNumber: 1,
      hash: null,
      intents: [
        {
          type: "spawn",
          clientID: "PLYR_A",
          tile: 0,
        },
        {
          type: "build_unit",
          clientID: "PLYR_A",
          unit: "City",
          tile: 0,
        },
      ],
    };

    session.applyTurn(turn);

    const snapshot = session.snapshot();
    expect(snapshot.turnNumber).toBe(1);
    expect(snapshot.processedTurnCount).toBe(1);
    expect(snapshot.supportedIntentCount).toBe(2);
    expect(snapshot.simulationOwnedTileCount).toBe(1);
    expect(snapshot.simulationActiveUnitCount).toBe(1);
    expect(snapshot.simulationCurrentTurn).toBe(1);
  });
});
