import { describe, expect, it } from "vitest";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";
import { filterGraph } from "../../../src/lib/graph/filterGraph";
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

describe("graph/filterGraph", () => {
  it("keeps the original tree when hide non-matches is off", () => {
    const root = createTree();

    const filtered = filterGraph({
      root,
      searchQuery: "beta",
      hideNonMatches: false,
      treeIndex: flattenTreePreorder(root),
    });

    expect(filtered.visibleRoot).toBe(root);
    expect(filtered.shouldHideNonMatches).toBe(false);
  });

  it("clones only matching branches when hide non-matches is on", () => {
    const root = createTree();

    const filtered = filterGraph({
      root,
      searchQuery: "beta",
      hideNonMatches: true,
      treeIndex: flattenTreePreorder(root),
    });

    expect(filtered.visibleRoot).not.toBe(root);
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
});
