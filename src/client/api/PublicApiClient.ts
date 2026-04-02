import { z } from "zod";
import { resolveApiBase } from "../config/apiBase";
import { AuthClient } from "../auth/AuthClient";

const RankedLeaderboardRowSchema = z.object({
  playerID: z.string(),
  elo: z.number(),
  wins: z.number().optional(),
  losses: z.number().optional(),
});

const RankedLeaderboardResponseSchema = z.object({
  page: z.number(),
  pageCount: z.number(),
  players: z.array(RankedLeaderboardRowSchema),
});

const UserMeResponseSchema = z.object({
  user: z.object({
    discord: z
      .object({
        username: z.string(),
        avatar: z.string().nullable().optional(),
      })
      .optional(),
    email: z.string().optional(),
  }),
  player: z.object({
    id: z.string(),
    displayName: z.string(),
    leaderboard: z
      .object({
        oneVone: z
          .object({
            elo: z.number(),
          })
          .optional(),
      })
      .optional(),
  }),
});

const GameRecordSchema = z.object({
  info: z.object({
    gameID: z.string(),
  }),
});

export type RankedLeaderboardResponse = z.infer<
  typeof RankedLeaderboardResponseSchema
>;
export type UserMeResponse = z.infer<typeof UserMeResponseSchema>;
export type GameRecord = z.infer<typeof GameRecordSchema>;

export class PublicApiClient {
  private readonly authClient: AuthClient;

  constructor(authClient: AuthClient) {
    this.authClient = authClient;
  }

  async getUserMe(): Promise<UserMeResponse | false> {
    try {
      const auth = await this.authClient.userAuth();
      if (!auth) {
        return false;
      }

      const response = await fetch(resolveApiBase() + "/users/@me", {
        headers: {
          authorization: `Bearer ${auth.jwt}`,
        },
      });
      if (!response.ok) {
        return false;
      }

      const json = await response.json();
      const parsed = UserMeResponseSchema.safeParse(json);
      if (!parsed.success) {
        return false;
      }
      return parsed.data;
    } catch {
      return false;
    }
  }

  async fetchGameById(gameId: string): Promise<GameRecord | false> {
    try {
      const response = await fetch(
        `${resolveApiBase()}/game/${encodeURIComponent(gameId)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      if (!response.ok) {
        return false;
      }

      const json = await response.json();
      const parsed = GameRecordSchema.safeParse(json);
      if (!parsed.success) {
        return false;
      }
      return parsed.data;
    } catch {
      return false;
    }
  }

  async fetchPlayerLeaderboard(
    page: number,
  ): Promise<RankedLeaderboardResponse | "reached_limit" | false> {
    try {
      const url = new URL(resolveApiBase() + "/leaderboard/ranked");
      url.searchParams.set("page", String(page));

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        return false;
      }

      const json = await response.json();
      const parsed = RankedLeaderboardResponseSchema.safeParse(json);
      if (!parsed.success) {
        const message =
          typeof json === "object" &&
          json !== null &&
          "message" in json &&
          typeof (json as { message?: unknown }).message === "string"
            ? (json as { message: string }).message
            : "";

        if (message.includes("Page must be between")) {
          return "reached_limit";
        }
        return false;
      }

      return parsed.data;
    } catch {
      return false;
    }
  }
}
