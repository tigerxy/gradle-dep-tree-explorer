import { describe, expect, it } from "vitest";
import {
  buildGraphModel,
  buildGraphTree,
  createMemoizedGraphModelBuilder,
} from "../../../src/lib/graph/buildGraphModel";
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
        status: "changed",
        children: [],
      },
    ],
  };
}

describe("graph/buildGraphModel", () => {
  it("builds graph labels and layout data from the graph root", () => {
    const graphRoot = buildGraphTree(createTree(), new Set<string>(["com.example:alpha"]));
    const model = buildGraphModel({
      hasData: true,
      root: graphRoot,
    });

    expect(model.hasData).toBe(true);
    expect(model.nodes.map((node) => node.data.label)).toEqual([
      "root",
      "★ com.example:alpha:1.0.0",
    ]);
    expect(model.links).toHaveLength(1);
  });

  it("returns an empty model when no source tree is available", () => {
    const model = buildGraphModel({
      hasData: false,
      root: null,
    });

    expect(model.hasData).toBe(false);
    expect(model.root).toBeNull();
    expect(model.nodes).toEqual([]);
    expect(model.links).toEqual([]);
  });

  it("memoizes repeated graph model access with identical inputs", () => {
    const buildMemoizedGraphModel = createMemoizedGraphModelBuilder();
    const root = createTree();
    const favorites = new Set<string>(["com.example:alpha"]);
    const treeIndex = flattenTreePreorder(root);

    const first = buildMemoizedGraphModel({
      root,
      searchQuery: "alpha",
      hideNonMatches: true,
      treeIndex,
      favorites,
    });
    const second = buildMemoizedGraphModel({
      root,
      searchQuery: "alpha",
      hideNonMatches: true,
      treeIndex,
      favorites,
    });
    const changed = buildMemoizedGraphModel({
      root,
      searchQuery: "beta",
      hideNonMatches: true,
      treeIndex,
      favorites,
    });

    expect(second).toBe(first);
    expect(changed).not.toBe(first);
  });
});
