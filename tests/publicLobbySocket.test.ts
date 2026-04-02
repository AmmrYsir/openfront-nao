import { describe, expect, test } from "bun:test";
import { parsePublicGamesPayload } from "../src/client/lobby/PublicLobbySocket";

describe("PublicLobbySocket payload parsing", () => {
  test("parses valid lobby payload", () => {
    const parsed = parsePublicGamesPayload({
      lobbies: [
        {
          gameID: "GAME123",
          playerCount: 2,
          maxPlayers: 64,
        },
      ],
    });

    expect(parsed).toBeTruthy();
    expect(parsed?.lobbies[0]?.gameID).toBe("GAME123");
  });

  test("rejects invalid lobby payload", () => {
    expect(
      parsePublicGamesPayload({
        lobbies: [{ playerCount: 1 }],
      }),
    ).toBeNull();
  });
});
