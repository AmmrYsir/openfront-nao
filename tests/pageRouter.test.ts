import { describe, expect, test } from "bun:test";
import { PageRouter } from "../src/ui/navigation/PageRouter";

describe("PageRouter", () => {
  test("tracks current page and notifies listeners", () => {
    const router = new PageRouter("page-play");
    const seen: string[] = [];
    const detach = router.onChange((pageId) => {
      seen.push(pageId);
    });

    router.showPage("page-account");
    router.showPage("page-account");
    router.showPage("page-lobby");
    detach();
    router.showPage("page-settings");

    expect(router.getCurrentPageId()).toBe("page-settings");
    expect(seen).toEqual(["page-account", "page-lobby"]);
  });
});
