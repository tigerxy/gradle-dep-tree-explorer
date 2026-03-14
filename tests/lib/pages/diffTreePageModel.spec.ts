import { describe, expect, it } from "vitest";
import { createDiffTreePageModel } from "../../../src/lib/pages/diffTreePageModel";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";
import type { DiffNode } from "../../../src/lib/types";

function createTree(): DiffNode {
  return {
    id: "root",
    name: "root:root",
    declaredVersion: "",
    resolvedVersion: "",
    depth: 0,
    descendantCount: 3,
    status: "unchanged",
    children: [
      {
        id: "alpha",
        name: "com.example:alpha",
        declaredVersion: "1.0.0",
        resolvedVersion: "1.0.0",
        depth: 1,
        descendantCount: 1,
        status: "unchanged",
        children: [
          {
            id: "beta",
            name: "com.example:beta",
            declaredVersion: "1.0.0",
            resolvedVersion: "1.0.0",
            depth: 2,
            descendantCount: 0,
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
        depth: 1,
        descendantCount: 0,
        status: "removed",
        children: [],
      },
    ],
  };
}

describe("pages/diffTreePageModel", () => {
  it("precomputes visible ids for matching status branches", () => {
    const root = createTree();
    const model = createDiffTreePageModel({
      root,
      oldRootAvailable: true,
      searchQuery: "",
      favorites: new Set<string>(),
      treeIndex: flattenTreePreorder(root),
      filters: {
        added: false,
        removed: false,
        changed: true,
        unchanged: false,
        favorites: false,
      },
    });

    expect(model.visibleNodeIds).toEqual(new Set(["root", "alpha", "beta"]));
    expect(model.visibleNodeIndexes).toEqual([0, 1, 2]);
    expect(model.listing.items.map((node) => node.id)).toEqual(["root", "alpha", "beta"]);
    expect(model.isNodeVisible(root.children[1])).toBe(false);
  });

  it("intersects visible branches with the search match index", () => {
    const root = createTree();
    const model = createDiffTreePageModel({
      root,
      oldRootAvailable: true,
      searchQuery: "beta",
      favorites: new Set<string>(),
      treeIndex: flattenTreePreorder(root),
      filters: {
        added: false,
        removed: true,
        changed: false,
        unchanged: false,
        favorites: false,
      },
    });

    expect(model.matchingNodeIds).toEqual(new Set(["beta"]));
    expect(model.matchingAncestorIds).toEqual(new Set(["root", "alpha"]));
    expect(model.visibleNodeIds).toEqual(new Set());
    expect(model.listing.items).toEqual([]);
  });

  it("keeps ancestor branches visible for favorite descendants", () => {
    const root = createTree();
    const model = createDiffTreePageModel({
      root,
      oldRootAvailable: false,
      searchQuery: "",
      favorites: new Set<string>(["com.example:beta"]),
      treeIndex: flattenTreePreorder(root),
      filters: {
        added: false,
        removed: false,
        changed: false,
        unchanged: false,
        favorites: true,
      },
    });

    expect(model.statusFiltersEnabled).toBe(false);
    expect(model.visibleNodeIds).toEqual(new Set(["root", "alpha", "beta"]));
    expect(model.listing.items.map((node) => node.id)).toEqual(["root", "alpha", "beta"]);
  });
});
