import { describe, it, expect } from "vitest";
import { createGraphPageModel } from "../../../src/lib/pages/graphPageModel";
import type { DiffNode } from "../../../src/lib/types";

const leaf: DiffNode = {
  id: "child",
  name: "com.acme:child",
  declaredVersion: "1.0.0",
  resolvedVersion: "1.0.0",
  prevDeclaredVersion: undefined,
  prevResolvedVersion: undefined,
  status: "unchanged",
  children: [],
  depth: 1,
  descendantCount: 0,
};

const root: DiffNode = {
  id: "root",
  name: "root:root",
  declaredVersion: "1.0.0",
  resolvedVersion: "1.0.0",
  prevDeclaredVersion: undefined,
  prevResolvedVersion: undefined,
  status: "unchanged",
  children: [leaf],
  depth: 0,
  descendantCount: 1,
};

describe("createGraphPageModel", () => {
  it("returns empty model when no root is provided", () => {
    const model = createGraphPageModel({
      root: null,
      searchQuery: "",
      hideNonMatches: false,
    });

    expect(model.hasData).toBe(false);
    expect(model.listing.items.length).toBe(0);
    expect(model.shouldHideNonMatches).toBe(false);
  });

  it("builds listing and respects hideNonMatches flag", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "acme",
      hideNonMatches: true,
    });

    expect(model.hasData).toBe(true);
    expect(model.listing.items.length).toBe(2);
    expect(model.filters.hideNonMatches.active).toBe(true);
    expect(model.shouldHideNonMatches).toBe(true);
    expect(model.search.matches(leaf)).toBe(true);
  });

  it("keeps matches when search is empty and hideNonMatches is off", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "",
      hideNonMatches: false,
    });

    expect(model.listing.items.map((n) => n.id)).toEqual(["root", "child"]);
    expect(model.shouldHideNonMatches).toBe(false);
    expect(model.search.isActive).toBe(false);
    expect(model.search.matches(leaf)).toBe(true);
  });

  it("returns false when the search does not match the node", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "missing",
      hideNonMatches: false,
    });

    expect(model.search.isActive).toBe(true);
    expect(model.search.matches(leaf)).toBe(false);
  });
});
