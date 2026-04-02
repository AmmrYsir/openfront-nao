import { describe, expect, test } from "bun:test";
import { parseJwtPayload } from "../src/client/auth/jwt";

function createUnsignedJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.`;
}

describe("jwt parsing", () => {
  test("parses payload from JWT token", () => {
    const token = createUnsignedJwt({
      sub: "player-123",
      iss: "https://api.openfront.io",
      aud: "openfront.io",
    });
    const parsed = parseJwtPayload(token);
    expect(parsed).toBeTruthy();
    expect(parsed?.sub).toBe("player-123");
  });

  test("returns null for malformed token", () => {
    expect(parseJwtPayload("bad-token")).toBeNull();
  });
});
