import { describe, expect, test } from "bun:test";
import {
  inferOsFromUserAgent,
  normalizePlatformName,
} from "../src/client/platform/Platform";

describe("Platform helpers", () => {
  test("normalizes known platform names", () => {
    expect(normalizePlatformName("Windows NT")).toBe("Windows");
    expect(normalizePlatformName("macOS")).toBe("macOS");
    expect(normalizePlatformName("iPad")).toBe("iOS");
    expect(normalizePlatformName("android")).toBe("Android");
  });

  test("infers iOS from iPad desktop user-agent with touch points", () => {
    expect(
      inferOsFromUserAgent({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15",
        maxTouchPoints: 5,
      }),
    ).toBe("iOS");
  });

  test("prefers userAgentData platform when available", () => {
    expect(
      inferOsFromUserAgent({
        userAgent: "",
        userAgentData: {
          platform: "Windows",
        },
      }),
    ).toBe("Windows");
  });
});
