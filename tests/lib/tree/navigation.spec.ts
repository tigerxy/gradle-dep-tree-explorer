import { describe, it, expect } from "vitest";
import { findNodeByPath, hasMatchOrDesc } from "../../../src/lib/tree/navigation";

interface TestNode {
  name: string;
  resolvedVersion: string;
  children: TestNode[];
}

const tree: TestNode = {
  name: "root:root",
  resolvedVersion: "",
  children: [
    {
      name: "com.example:parent",
      resolvedVersion: "1.0.0",
      children: [
        {
          name: "com.example:leaf",
          resolvedVersion: "2.0.0",
          children: [],
        },
        {
          name: "com.example:noversion",
          resolvedVersion: "",
          children: [],
        },
      ],
    },
  ],
};

describe("tree/navigation", () => {
  it("finds direct and descendant matches", () => {
    const matcher = (q: string, node: TestNode) => `${node.name}:${node.resolvedVersion}`.includes(q);

    expect(hasMatchOrDesc(tree, "parent", matcher)).toBe(true);
    expect(hasMatchOrDesc(tree, "leaf", matcher)).toBe(true);
    expect(hasMatchOrDesc(tree, "missing", matcher)).toBe(false);
  });

  it("returns undefined for missing root or empty path", () => {
    expect(findNodeByPath(tree, "")).toEqual({ node: undefined, ancestors: [] });
    expect(findNodeByPath(tree, "  ›  ")).toEqual({ node: undefined, ancestors: [] });
    expect(findNodeByPath(null as unknown as TestNode, "anything")).toEqual({
      node: undefined,
      ancestors: [],
    });
  });

  it("resolves root-prefixed and partial paths", () => {
    expect(findNodeByPath(tree, "root  ›  com.example:parent:1.0.0").node?.name).toBe(
      "com.example:parent",
    );

    const partial = findNodeByPath(
      tree,
      "root  ›  com.example:parent:1.0.0  ›  com.example:missing:9.9.9",
    );
    expect(partial.node?.name).toBe("com.example:parent");
    expect(partial.ancestors.map((node) => node.name)).toEqual(["com.example:parent"]);
  });

  it("matches path segments without a resolved version suffix", () => {
    const result = findNodeByPath(
      tree,
      "root  ›  com.example:parent:1.0.0  ›  com.example:noversion",
    );

    expect(result.node?.name).toBe("com.example:noversion");
  });
});
