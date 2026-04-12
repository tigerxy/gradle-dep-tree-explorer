import { describe, expect, it } from "vitest";
import { buildUpdatePathItemsHtml, createUpdatePathItems } from "../../src/pages/updatesPagePaths";

describe("updatesPagePaths", () => {
  it("returns a placeholder when no paths are available", () => {
    expect(createUpdatePathItems([])).toEqual([
      { path: "No dependency paths recorded.", canJump: false },
    ]);
  });

  it("marks real paths as jumpable", () => {
    expect(createUpdatePathItems(["a > b"])).toEqual([{ path: "a > b", canJump: true }]);
  });

  it("builds escaped html rows", () => {
    expect(
      buildUpdatePathItemsHtml([
        { path: "<unsafe>", canJump: false },
        { path: "safe", canJump: true },
      ]),
    ).toBe(
      '<li class="is-flex is-justify-content-space-between is-align-items-center">&lt;unsafe&gt;&nbsp;<button class="button is-small is-light" data-path="&lt;unsafe&gt;" disabled hidden><span class="icon"><i class="fa-solid fa-folder-tree"></i></span><span>Diff Tree</span></button></li><li class="is-flex is-justify-content-space-between is-align-items-center">safe&nbsp;<button class="button is-small is-light" data-path="safe"><span class="icon"><i class="fa-solid fa-folder-tree"></i></span><span>Diff Tree</span></button></li>',
    );
  });
});
