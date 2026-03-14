import { describe, it, expect } from "vitest";
import { createGraphPageModel } from "../../../src/lib/pages/graphPageModel";
import type { DiffNode } from "../../../src/lib/types";
import type { SharedDiffFilters } from "../../../src/lib/pages/sharedDiffFilters";

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

const noFilters: SharedDiffFilters = {
  added: false,
  removed: false,
  changed: false,
  unchanged: false,
  favorites: false,
};

describe("createGraphPageModel", () => {
  it("returns empty model when no root is provided", () => {
    const model = createGraphPageModel({
      root: null,
      searchQuery: "",
      oldRootAvailable: false,
      favorites: new Set<string>(),
      filters: noFilters,
    });

    expect(model.hasData).toBe(false);
    expect(model.listing.items.length).toBe(0);
    expect(model.hasActiveVisibilityFilter).toBe(false);
  });

  it("builds listing and applies search matches automatically", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "acme",
      oldRootAvailable: true,
      favorites: new Set<string>(),
      filters: noFilters,
    });

    expect(model.hasData).toBe(true);
    expect(model.listing.items.length).toBe(2);
    expect(model.filters.changed.available).toBe(true);
    expect(model.hasActiveVisibilityFilter).toBe(true);
    expect(model.search.matches(leaf)).toBe(true);
  });

  it("keeps all nodes when search is empty and filters are inactive", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "",
      oldRootAvailable: true,
      favorites: new Set<string>(),
      filters: noFilters,
    });

    expect(model.listing.items.map((n) => n.id)).toEqual(["root", "child"]);
    expect(model.hasActiveVisibilityFilter).toBe(false);
    expect(model.search.isActive).toBe(false);
    expect(model.search.matches(leaf)).toBe(true);
  });

  it("applies shared favorites filters", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "",
      oldRootAvailable: true,
      favorites: new Set<string>(["com.acme:child"]),
      filters: { ...noFilters, favorites: true },
    });

    expect(model.filters.favorites.active).toBe(true);
    expect(model.listing.items.map((n) => n.id)).toEqual(["root", "child"]);
  });

  it("returns false when the search does not match the node", () => {
    const model = createGraphPageModel({
      root,
      searchQuery: "missing",
      oldRootAvailable: true,
      favorites: new Set<string>(),
      filters: noFilters,
    });

    expect(model.search.isActive).toBe(true);
    expect(model.search.matches(leaf)).toBe(false);
  });
});
