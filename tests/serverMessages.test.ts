import { describe, expect, test } from "bun:test";
import {
  parseLegacyClientMessage,
  parseServerMessage,
  toServerTurnEnvelope,
} from "../src/game/network/serverMessages";

describe("serverMessages protocol parsing", () => {
  test("parses legacy turn payload", () => {
    const parsed = parseServerMessage({
      type: "turn",
      turn: {
        turnNumber: 3,
        intents: [],
        hash: null,
      },
    });

    const envelope = toServerTurnEnvelope(parsed);
    expect(envelope).not.toBeNull();
    expect(envelope?.turns.length).toBe(1);
    expect(envelope?.turns[0]?.turnNumber).toBe(3);
  });

  test("parses legacy start payload with catch-up turns", () => {
    const parsed = parseServerMessage({
      type: "start",
      turns: [
        {
          turnNumber: 1,
          intents: [],
          hash: null,
        },
        {
          turnNumber: 2,
          intents: [],
          hash: null,
        },
      ],
      gameStartInfo: {},
      lobbyCreatedAt: Date.now(),
      myClientID: "PLYR0001",
    });

    const envelope = toServerTurnEnvelope(parsed);
    expect(envelope).not.toBeNull();
    expect(envelope?.turns.length).toBe(2);
  });

  test("parses legacy client intent payload", () => {
    const parsed = parseLegacyClientMessage({
      type: "intent",
      intent: {
        type: "toggle_pause",
        paused: true,
      },
    });

    expect(parsed.type).toBe("intent");
    if (parsed.type === "intent") {
      expect(parsed.intent.type).toBe("toggle_pause");
    }
  });
});
