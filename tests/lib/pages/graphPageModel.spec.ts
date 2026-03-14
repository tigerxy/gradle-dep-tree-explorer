import { describe, expect, it } from "vitest";
import { createGraphPageModel } from "../../../src/lib/pages/graphPageModel";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";
import type { DiffNode } from "../../../src/lib/types";

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

describe("pages/graphPageModel", () => {
  it("reuses the original tree when hide non-matches is off", () => {
    const root = createTree();

    const model = createGraphPageModel({
      root,
      searchQuery: "beta",
      hideNonMatches: false,
      treeIndex: flattenTreePreorder(root),
    });

    expect(model.visibleRoot).toBe(root);
    expect(model.listing.items).toHaveLength(4);
  });

  it("keeps only matching branches when hide non-matches is on", () => {
    const root = createTree();

    const model = createGraphPageModel({
      root,
      searchQuery: "beta",
      hideNonMatches: true,
      treeIndex: flattenTreePreorder(root),
    });

    expect(model.visibleRoot).not.toBe(root);
    expect(model.visibleRoot).toMatchObject({
      id: "root",
      children: [
        {
          id: "alpha",
          children: [{ id: "beta", children: [] }],
        },
      ],
    });
    expect(model.visibleRoot?.children).toHaveLength(1);
    expect(model.visibleRoot?.children[0]?.children).toHaveLength(1);
    expect(model.listing.items.map((node) => node.id)).toEqual(["root", "alpha", "beta"]);
  });
});
