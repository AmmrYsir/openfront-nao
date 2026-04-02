import { describe, expect, test } from "bun:test";
import { LobbyDirectoryClient } from "../src/client/lobby/LobbyDirectoryClient";

describe("LobbyDirectoryClient", () => {
  test("lists public lobbies from API", async () => {
    const fetcher: typeof fetch = (async () =>
      new Response(
        JSON.stringify({
          lobbies: [
            {
              gameID: "ABC123",
              updatedAt: 100,
              payload: { map: "world" },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )) as typeof fetch;

    const client = new LobbyDirectoryClient({ fetcher });
    const lobbies = await client.listPublicLobbies();

    expect(lobbies).toHaveLength(1);
    expect(lobbies[0]?.gameID).toBe("ABC123");
  });

  test("requires API key to upsert or remove lobby", async () => {
    const fetcher: typeof fetch = (async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;

    const client = new LobbyDirectoryClient({ fetcher });

    expect(await client.upsertPublicLobby("ABC", { mode: "public" })).toBe(false);
    expect(await client.removePublicLobby("ABC")).toBe(false);
  });
});
