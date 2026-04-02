export interface LiveTurnTransportConfig {
  url: string;
  gameID: string;
  mode: "legacy" | "modern";
  legacySession:
    | {
        username: string;
        token: string;
        clanTag: string | null;
        turnstileToken: string | null;
        lastTurn: number | undefined;
      }
    | null;
}

export function resolveLiveTurnTransportConfig(
  params: URLSearchParams,
): LiveTurnTransportConfig | null {
  const url = params.get("ws");
  const gameID = params.get("gameId");
  const protocol = params.get("wsProtocol");
  const mode = protocol === "legacy" ? "legacy" : "modern";

  if (!url || !gameID) {
    return null;
  }

  const username = params.get("wsUsername");
  const token = params.get("wsToken");
  const clanTag = params.get("wsClanTag");
  const turnstileToken = params.get("wsTurnstileToken");
  const lastTurnRaw = params.get("wsLastTurn");
  const lastTurn =
    lastTurnRaw !== null && lastTurnRaw.trim() !== ""
      ? Number(lastTurnRaw)
      : undefined;

  const legacySession =
    mode === "legacy" && username && token
      ? {
          username,
          token,
          clanTag,
          turnstileToken,
          lastTurn: Number.isFinite(lastTurn ?? Number.NaN)
            ? lastTurn
            : undefined,
        }
      : null;

  return {
    url,
    gameID,
    mode,
    legacySession,
  };
}
