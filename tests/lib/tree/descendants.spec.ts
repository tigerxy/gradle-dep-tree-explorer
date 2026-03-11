import { describe, expect, it } from "vitest";
import { collectAllNodeIds, computeDescendantCounts } from "../../../src/lib/tree/descendants";

describe("tree/descendants", () => {
  it("computes descendant counts recursively", () => {
    const root = {
      id: "root",
      descendantCount: 0,
      children: [
        {
          id: "a",
          descendantCount: 0,
          children: [{ id: "a1", descendantCount: 0, children: [] }],
        },
        { id: "b", descendantCount: 0, children: [] },
      ],
    };

    expect(computeDescendantCounts(root)).toBe(3);
    expect(root.descendantCount).toBe(3);
    expect(root.children[0]?.descendantCount).toBe(1);
    expect(root.children[1]?.descendantCount).toBe(0);
  });

  it("collects all node ids in a tree", () => {
    const ids = collectAllNodeIds({
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [{ id: "b1", children: [] }] },
      ],
    });

    expect(ids).toEqual(new Set(["root", "a", "b", "b1"]));
  });
});
