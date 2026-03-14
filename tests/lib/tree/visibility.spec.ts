import { describe, expect, it } from "vitest";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";
import { computeVisibleNodeIndex } from "../../../src/lib/tree/visibility";

describe("tree/visibility", () => {
  it("propagates descendant visibility to ancestors in preorder indexes", () => {
    const root = {
      id: "root",
      children: [
        {
          id: "a",
          children: [
            {
              id: "a1",
              children: [],
            },
          ],
        },
        {
          id: "b",
          children: [],
        },
      ],
    };

    const flattened = flattenTreePreorder(root);
    const result = computeVisibleNodeIndex(flattened, (_node, index) => index === 2);

    expect(result.visibleByIndex).toEqual([true, true, true, false]);
    expect(result.visibleNodeIndexes).toEqual([0, 1, 2]);
    expect(result.visibleNodeIds).toEqual(new Set(["root", "a", "a1"]));
  });

  it("returns empty visibility indexes when the tree is missing", () => {
    expect(computeVisibleNodeIndex(null, () => true)).toEqual({
      visibleNodeIndexes: [],
      visibleNodeIds: new Set(),
      visibleByIndex: [],
    });
  });
});
