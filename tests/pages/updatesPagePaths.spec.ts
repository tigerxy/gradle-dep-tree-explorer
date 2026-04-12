import { describe, expect, it } from "vitest";
import { createUpdatePathItems } from "../../src/pages/updatesPagePaths";

describe("updatesPagePaths", () => {
  it("returns a placeholder when no paths are available", () => {
    expect(createUpdatePathItems([])).toEqual([
      { path: "No dependency paths recorded.", canJump: false },
    ]);
  });

  it("marks real paths as jumpable", () => {
    expect(createUpdatePathItems(["a > b"])).toEqual([{ path: "a > b", canJump: true }]);
  });
});
