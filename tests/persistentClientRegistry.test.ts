import { describe, expect, test } from "bun:test";
import { PersistentClientRegistry } from "../src/server/PersistentClientRegistry";

describe("PersistentClientRegistry", () => {
  test("registers and resolves persistent IDs", () => {
    const registry = new PersistentClientRegistry();
    registry.register("persist-a", "client-1");
    expect(registry.resolveClientID("persist-a")).toBe("client-1");
  });

  test("returns null after persistent ID is kicked", () => {
    const registry = new PersistentClientRegistry();
    registry.register("persist-a", "client-1");
    registry.markKicked("persist-a");
    expect(registry.resolveClientID("persist-a")).toBeNull();
    expect(registry.isKicked("persist-a")).toBe(true);
  });
});
