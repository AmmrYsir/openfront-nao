export interface LiveTurnTransportConfig {
  url: string;
  gameID: string;
}

export function resolveLiveTurnTransportConfig(
  params: URLSearchParams,
): LiveTurnTransportConfig | null {
  const url = params.get("ws");
  const gameID = params.get("gameId");

  if (!url || !gameID) {
    return null;
  }

  return {
    url,
    gameID,
  };
}
