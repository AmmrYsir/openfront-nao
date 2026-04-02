import { describe, expect, test } from "bun:test";
import { GameArchiveClient } from "../src/server/GameArchiveClient";

describe("GameArchiveClient", () => {
  test("archives valid game record", async () => {
    const requests: string[] = [];
    const fetcher: typeof fetch = (async (input) => {
      requests.push(String(input));
      return new Response(null, { status: 200 });
    }) as typeof fetch;

    const client = new GameArchiveClient({
      apiBase: "https://api.openfront.io",
      apiKey: "secret",
      fetcher,
    });

    const archived = await client.archive({
      info: {
        gameID: "GAME-1",
      },
    });

    expect(archived).toBe(true);
    expect(requests[0]).toContain("/game/GAME-1");
  });

  test("reads game record when response payload is valid", async () => {
    const fetcher: typeof fetch = (async () => {
      return new Response(
        JSON.stringify({
          info: {
            gameID: "GAME-2",
          },
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const client = new GameArchiveClient({
      apiBase: "https://api.openfront.io",
      apiKey: "secret",
      fetcher,
    });

    const record = await client.readGameRecord("GAME-2");
    expect(record?.info.gameID).toBe("GAME-2");
  });
});
