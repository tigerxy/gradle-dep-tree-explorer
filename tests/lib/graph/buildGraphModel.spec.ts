import { describe, expect, it } from "vitest";
import { buildGraphModel } from "../../../src/lib/graph/buildGraphModel";
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
  it("builds graph labels and layout data from the visible root", () => {
    const model = buildGraphModel({
      sourceRoot: createTree(),
      visibleRoot: createTree(),
      favorites: new Set<string>(["com.example:alpha"]),
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
      sourceRoot: null,
      visibleRoot: null,
      favorites: new Set<string>(),
    });

    expect(model.hasData).toBe(false);
    expect(model.root).toBeNull();
    expect(model.nodes).toEqual([]);
    expect(model.links).toEqual([]);
  });
});
