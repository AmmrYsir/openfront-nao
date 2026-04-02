import type { LeaderboardRepository, UserRepository } from "../repositories/types";

interface JwtPayload {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

function toBase64Url(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64url");
}

function fromBase64Url(text: string): string {
  return Buffer.from(text, "base64url").toString("utf-8");
}

function signUnsignedJwt(payload: JwtPayload): string {
  const header = {
    alg: "none",
    typ: "JWT",
  };
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.`;
}

function parseUnsignedJwt(token: string): JwtPayload | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(segments[1])) as JwtPayload;
    if (typeof parsed.sub !== "string") return null;
    if (typeof parsed.iss !== "string") return null;
    if (typeof parsed.aud !== "string") return null;
    if (typeof parsed.exp !== "number") return null;
    if (typeof parsed.iat !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildDefaultDisplayName(persistentID: string): string {
  const suffix = persistentID.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `Commander-${suffix || "Pilot"}`;
}

export interface AuthServiceOptions {
  issuer: string;
  audience: string;
  ttlSeconds?: number;
  userRepository: UserRepository;
  leaderboardRepository: LeaderboardRepository;
}

export class AuthService {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly ttlSeconds: number;
  private readonly userRepository: UserRepository;
  private readonly leaderboardRepository: LeaderboardRepository;

  constructor(options: AuthServiceOptions) {
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.ttlSeconds = options.ttlSeconds ?? 24 * 60 * 60;
    this.userRepository = options.userRepository;
    this.leaderboardRepository = options.leaderboardRepository;
  }

  async refreshForPersistentID(
    persistentID: string,
  ): Promise<{ jwt: string; expiresIn: number }> {
    const safePersistentID = persistentID.trim();
    if (safePersistentID.length === 0) {
      throw new Error("persistent_id_required");
    }

    await this.userRepository.upsertByPersistentID({
      persistentID: safePersistentID,
      displayName: buildDefaultDisplayName(safePersistentID),
    });

    const nowSeconds = Math.floor(Date.now() / 1000);
    const jwt = signUnsignedJwt({
      sub: safePersistentID,
      iss: this.issuer,
      aud: this.audience,
      iat: nowSeconds,
      exp: nowSeconds + this.ttlSeconds,
    });

    return {
      jwt,
      expiresIn: this.ttlSeconds,
    };
  }

  async readUserFromToken(token: string): Promise<{
    persistentID: string;
    displayName: string;
    email: string | null;
    discordUsername: string | null;
    elo: number;
  } | null> {
    const parsed = parseUnsignedJwt(token);
    if (!parsed) {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (parsed.exp <= nowSeconds) {
      return null;
    }

    if (parsed.iss !== this.issuer || parsed.aud !== this.audience) {
      return null;
    }

    const user = await this.userRepository.upsertByPersistentID({
      persistentID: parsed.sub,
      displayName: buildDefaultDisplayName(parsed.sub),
    });
    const rank = await this.leaderboardRepository.getByPersistentID(parsed.sub);

    return {
      persistentID: parsed.sub,
      displayName: user.displayName,
      email: user.email,
      discordUsername: user.discordUsername,
      elo: rank?.elo ?? 1000,
    };
  }
}
