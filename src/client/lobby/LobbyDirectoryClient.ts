import { resolveApiBase } from "../config/apiBase";

export interface PublicLobbyInfo {
  gameID: string;
  updatedAt: number;
  payload: Record<string, unknown>;
}

interface ListLobbiesResponse {
  lobbies: PublicLobbyInfo[];
}

export class LobbyDirectoryClient {
  private readonly apiKey: string | null;
  private readonly fetcher: typeof fetch;

  constructor(options?: { apiKey?: string | null; fetcher?: typeof fetch }) {
    this.apiKey = options?.apiKey ?? null;
    this.fetcher = options?.fetcher ?? fetch;
  }

  async listPublicLobbies(): Promise<PublicLobbyInfo[]> {
    const response = await this.fetcher(resolveApiBase() + "/api/lobbies", {
      method: "GET",
    });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as Partial<ListLobbiesResponse>;
    return Array.isArray(body.lobbies) ? body.lobbies : [];
  }

  async upsertPublicLobby(
    gameID: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    const response = await this.fetcher(resolveApiBase() + "/api/lobbies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        gameID,
        payload,
      }),
    });
    return response.ok;
  }

  async removePublicLobby(gameID: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    const response = await this.fetcher(
      resolveApiBase() + `/api/lobbies/${encodeURIComponent(gameID)}`,
      {
        method: "DELETE",
        headers: {
          "x-api-key": this.apiKey,
        },
      },
    );
    return response.ok;
  }
}
