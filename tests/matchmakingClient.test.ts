import { describe, expect, test } from "bun:test";
import { parseMatchAssignment } from "../src/client/matchmaking/MatchmakingClient";

describe("MatchmakingClient payload parsing", () => {
  test("parses valid match assignment", () => {
    expect(
      parseMatchAssignment({
        type: "match-assignment",
        gameId: "ABC123",
      }),
    ).toBe("ABC123");
  });

  test("rejects non-assignment payload", () => {
    expect(
      parseMatchAssignment({
        type: "noop",
      }),
    ).toBeNull();
  });
});
