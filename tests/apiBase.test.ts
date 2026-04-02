import { describe, expect, test } from "bun:test";
import {
  deriveAudienceFromHostname,
  resolveApiBase,
} from "../src/client/config/apiBase";

describe("apiBase", () => {
  test("derives audience from hostname", () => {
    expect(deriveAudienceFromHostname("play.openfront.io")).toBe("openfront.io");
    expect(deriveAudienceFromHostname("localhost")).toBe("localhost");
  });

  test("resolves localhost API base with override first", () => {
    expect(
      resolveApiBase({
        hostname: "localhost",
        apiDomainOverride: "api.openfront.dev",
      }),
    ).toBe("https://api.openfront.dev");
  });

  test("resolves production API base from domain", () => {
    expect(
      resolveApiBase({
        hostname: "play.openfront.io",
      }),
    ).toBe("https://api.openfront.io");
  });
});
