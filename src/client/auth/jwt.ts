interface JwtPayload {
  sub?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function decodeBase64Url(input: string): string {
  const pad = input.length % 4;
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad);

  if (typeof atob === "function") {
    return atob(padded);
  }

  const bufferConstructor = (
    globalThis as unknown as {
      Buffer?: {
        from: (text: string, encoding: string) => {
          toString: (encoding: string) => string;
        };
      };
    }
  ).Buffer;
  if (bufferConstructor) {
    return bufferConstructor.from(padded, "base64").toString("utf-8");
  }

  throw new Error("Base64 decoding not supported in this runtime.");
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadText = decodeBase64Url(parts[1]);
    return JSON.parse(payloadText) as JwtPayload;
  } catch {
    return null;
  }
}
