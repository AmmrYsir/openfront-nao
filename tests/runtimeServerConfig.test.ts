import { describe, expect, test } from "bun:test";
import {
  BrowserRuntimeServerConfig,
  pickRandomWorkerPath,
} from "../src/client/config/RuntimeServerConfig";

describe("RuntimeServerConfig", () => {
  test("computes stable worker path by game id", () => {
    const config = new BrowserRuntimeServerConfig(4, "https://api.openfront.io");
    const a = config.workerPath("GAME123");
    const b = config.workerPath("GAME123");
    expect(a).toBe(b);
    expect(a.startsWith("/w")).toBe(true);
  });

  test("selects random worker path in range", () => {
    const path = pickRandomWorkerPath(3);
    expect(["/w0", "/w1", "/w2"]).toContain(path);
  });
});
