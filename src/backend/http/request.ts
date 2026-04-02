import type { IncomingMessage } from "node:http";

export async function readJsonBody(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk, "utf-8"));
    } else {
      chunks.push(chunk);
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  const text = Buffer.concat(chunks).toString("utf-8").trim();
  if (text.length === 0) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

export function readBearerToken(
  request: IncomingMessage,
): string | null {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }
  const [scheme, value] = authorization.split(" ");
  if (!scheme || !value) {
    return null;
  }
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return value;
}

export function readApiKeyHeader(request: IncomingMessage): string | null {
  const value = request.headers["x-api-key"];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
