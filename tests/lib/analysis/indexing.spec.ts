import { describe, expect, it } from "vitest";
import { indexNodes } from "../../../src/lib/analysis/indexing";
import type { DependencyNode } from "../../../src/lib/types";

const root: DependencyNode = {
  id: "root",
  name: "root:root",
  declaredVersion: "",
  resolvedVersion: "",
  depth: 0,
  descendantCount: 2,
  children: [
    {
      id: "a",
      name: "org.example:alpha",
      declaredVersion: "1.0.0",
      resolvedVersion: "1.0.0",
      depth: 1,
      descendantCount: 0,
      children: [],
    },
    {
      id: "b",
      name: "org.example:alpha",
      declaredVersion: "2.0.0",
      resolvedVersion: "2.0.0",
      depth: 1,
      descendantCount: 0,
      children: [],
    },
  ],
};

describe("analysis/indexing", () => {
  it("indexes non-root nodes by group-artifact and preserves traversal order", () => {
    const result = indexNodes(root);

    expect(result.allNodes.map((node) => node.id)).toEqual(["root", "a", "b"]);
    expect(result.nodeIndexByGA.get("org.example:alpha")?.map((node) => node.id)).toEqual([
      "a",
      "b",
    ]);
    expect(result.nodeIndexByGA.has("root:root")).toBe(false);
  });
});
