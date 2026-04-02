import { describe, expect, test } from "bun:test";
import { GameDirectory } from "../src/server/GameDirectory";

describe("GameDirectory", () => {
  test("creates and retrieves rooms by ID", () => {
    const directory = new GameDirectory();
    const room = directory.createRoom({
      gameID: "GAME-1",
      lobbyCreatedAt: 1234,
    });

    expect(directory.getRoom("GAME-1")).toBe(room);
    expect(directory.size()).toBe(1);
    expect(directory.listRoomIDs()).toEqual(["GAME-1"]);
  });

  test("removes rooms", () => {
    const directory = new GameDirectory();
    directory.createRoom({
      gameID: "GAME-2",
    });
    expect(directory.removeRoom("GAME-2")).toBe(true);
    expect(directory.removeRoom("GAME-2")).toBe(false);
    expect(directory.size()).toBe(0);
  });
});
