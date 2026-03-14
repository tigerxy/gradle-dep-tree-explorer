import { describe, expect, it } from "vitest";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";
import { filterGraph } from "../../../src/lib/graph/filterGraph";
import type { DiffNode } from "../../../src/lib/types";
import type { SharedDiffFilters } from "../../../src/lib/pages/sharedDiffFilters";

function createTree(): DiffNode {
  return {
    id: "root",
    name: "root:root",
    declaredVersion: "",
    resolvedVersion: "",
    prevDeclaredVersion: "",
    prevResolvedVersion: "",
    depth: -1,
    status: "unchanged",
    children: [
      {
        id: "alpha",
        name: "com.example:alpha",
        declaredVersion: "1.0.0",
        resolvedVersion: "1.0.0",
        prevDeclaredVersion: "1.0.0",
        prevResolvedVersion: "1.0.0",
        depth: 0,
        status: "unchanged",
        children: [
          {
            id: "beta",
            name: "com.example:beta",
            declaredVersion: "1.0.0",
            resolvedVersion: "1.0.0",
            prevDeclaredVersion: "1.0.0",
            prevResolvedVersion: "1.0.0",
            depth: 1,
            status: "changed",
            children: [],
          },
        ],
      },
      {
        id: "gamma",
        name: "com.example:gamma",
        declaredVersion: "1.0.0",
        resolvedVersion: "1.0.0",
        prevDeclaredVersion: "1.0.0",
        prevResolvedVersion: "1.0.0",
        depth: 0,
        status: "unchanged",
        children: [],
      },
    ],
  };
}

const noFilters: SharedDiffFilters = {
  added: false,
  removed: false,
  changed: false,
  unchanged: false,
  favorites: false,
};

describe("graph/filterGraph", () => {
  it("keeps the original tree when search and filters are inactive", () => {
    const root = createTree();

    const filtered = filterGraph({
      root,
      searchQuery: "",
      favorites: new Set<string>(),
      oldRootAvailable: true,
      filters: noFilters,
      treeIndex: flattenTreePreorder(root),
    });

    expect(filtered.visibleRoot).toBe(root);
    expect(filtered.hasActiveVisibilityFilter).toBe(false);
  });

  it("clones only matching branches when search is active", () => {
    const root = createTree();

    const filtered = filterGraph({
      root,
      searchQuery: "beta",
      favorites: new Set<string>(),
      oldRootAvailable: true,
      filters: noFilters,
      treeIndex: flattenTreePreorder(root),
    });

    expect(filtered.visibleRoot).not.toBe(root);
    expect(filtered.hasActiveVisibilityFilter).toBe(true);
    expect(filtered.visibleRoot).toMatchObject({
      id: "root",
      children: [
        {
          id: "alpha",
          children: [{ id: "beta", children: [] }],
        },
      ],
    });
  });

  it("applies shared status filters even without search", () => {
    const root = createTree();

    const filtered = filterGraph({
      root,
      searchQuery: "",
      favorites: new Set<string>(),
      oldRootAvailable: true,
      filters: { ...noFilters, changed: true },
      treeIndex: flattenTreePreorder(root),
    });

    expect(filtered.visibleRoot).not.toBe(root);
    expect(filtered.visibleRoot).toMatchObject({
      id: "root",
      children: [{ id: "alpha", children: [{ id: "beta", children: [] }] }],
    });
  });
});
