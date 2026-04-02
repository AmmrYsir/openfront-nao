import { z } from "zod";
import { getAudience, resolveApiBase } from "../config/apiBase";
import { parseJwtPayload } from "./jwt";

const PERSISTENT_ID_KEY = "player_persistent_id";

const TokenPayloadSchema = z.object({
  sub: z.string().optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
  iss: z.string().optional(),
  exp: z.number().optional(),
  iat: z.number().optional(),
  player: z
    .object({
      id: z.string().optional(),
      displayName: z.string().optional(),
    })
    .optional(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export interface UserAuthSuccess {
  jwt: string;
  claims: TokenPayload;
}

export type UserAuth = UserAuthSuccess | false;

function generateFallbackUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (char): string => {
      const random = Math.floor(Math.random() * 16);
      const value = char === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
}

function ensurePersistentId(): string {
  if (typeof localStorage === "undefined") {
    return generateFallbackUuid();
  }

  const existing = localStorage.getItem(PERSISTENT_ID_KEY);
  if (existing && existing.length > 0) {
    return existing;
  }

  const created = generateFallbackUuid();
  localStorage.setItem(PERSISTENT_ID_KEY, created);
  return created;
}

export class AuthClient {
  private jwt: string | null = null;
  private expiresAt = 0;
  private refreshPromise: Promise<void> | null = null;

  async getAuthHeader(): Promise<string> {
    const auth = await this.userAuth();
    if (!auth) {
      return "";
    }
    return `Bearer ${auth.jwt}`;
  }

  async userAuth(shouldRefresh = true): Promise<UserAuth> {
    if (!this.jwt) {
      if (!shouldRefresh) {
        return false;
      }
      await this.refreshJwt();
      return this.userAuth(false);
    }

    const parsed = parseJwtPayload(this.jwt);
    if (!parsed) {
      return false;
    }

    const claimsResult = TokenPayloadSchema.safeParse(parsed);
    if (!claimsResult.success) {
      return false;
    }

    const apiBase = resolveApiBase();
    if (claimsResult.data.iss && claimsResult.data.iss !== apiBase) {
      return false;
    }

    const audience = getAudience();
    const audClaim = claimsResult.data.aud;
    if (audience !== "localhost" && audClaim) {
      const matchesAudience = Array.isArray(audClaim)
        ? audClaim.includes(audience)
        : audClaim === audience;
      if (!matchesAudience) {
        return false;
      }
    }

    if (Date.now() >= this.expiresAt - 3 * 60_000) {
      if (!shouldRefresh) {
        return false;
      }
      await this.refreshJwt();
      return this.userAuth(false);
    }

    return {
      jwt: this.jwt,
      claims: claimsResult.data,
    };
  }

  async logOut(allSessions = false): Promise<boolean> {
    try {
      const response = await fetch(
        resolveApiBase() + (allSessions ? "/auth/revoke" : "/auth/logout"),
        {
          method: "POST",
          credentials: "include",
        },
      );
      return response.ok;
    } catch {
      return false;
    } finally {
      this.jwt = null;
      this.expiresAt = 0;
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(PERSISTENT_ID_KEY);
      }
    }
  }

  async sendMagicLink(email: string): Promise<boolean> {
    try {
      const response = await fetch(resolveApiBase() + "/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          redirectDomain:
            typeof window === "undefined" ? "http://localhost:5173" : window.location.origin,
          email,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getPlayToken(): Promise<string> {
    const auth = await this.userAuth();
    if (auth !== false) {
      return auth.jwt;
    }
    return ensurePersistentId();
  }

  getPersistentId(): string {
    if (!this.jwt) {
      return ensurePersistentId();
    }

    const parsed = parseJwtPayload(this.jwt);
    if (!parsed?.sub) {
      return ensurePersistentId();
    }

    return parsed.sub;
  }

  async setJwtFromRefreshResponse(payload: {
    jwt: string;
    expiresIn: number;
  }): Promise<void> {
    this.jwt = payload.jwt;
    this.expiresAt = Date.now() + payload.expiresIn * 1000;
  }

  private async refreshJwt(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(resolveApiBase() + "/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          this.jwt = null;
          this.expiresAt = 0;
          return;
        }

        const data = (await response.json()) as {
          jwt?: unknown;
          expiresIn?: unknown;
        };
        if (typeof data.jwt !== "string" || typeof data.expiresIn !== "number") {
          this.jwt = null;
          this.expiresAt = 0;
          return;
        }
        await this.setJwtFromRefreshResponse({
          jwt: data.jwt,
          expiresIn: data.expiresIn,
        });
      } catch {
        this.jwt = null;
        this.expiresAt = 0;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}
