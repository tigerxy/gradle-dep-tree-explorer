import { describe, expect, it } from "vitest";
import {
  buildParentIdsById,
  buildParentIdsByIdFromFlattened,
  findParentId,
} from "../../../src/lib/tree/parents";
import { flattenTreePreorder } from "../../../src/lib/tree/flatten";

const root = {
  id: "root",
  children: [
    {
      id: "a",
      children: [{ id: "a1", children: [] }],
    },
    { id: "b", children: [] },
  ],
};

describe("tree/parents", () => {
  it("builds a parent index for every non-root node", () => {
    expect(buildParentIdsById(root)).toEqual(
      new Map([
        ["a", "root"],
        ["a1", "a"],
        ["b", "root"],
      ]),
    );
  });

  it("builds the same parent index from a flattened tree", () => {
    expect(buildParentIdsByIdFromFlattened(flattenTreePreorder(root))).toEqual(
      new Map([
        ["a", "root"],
        ["a1", "a"],
        ["b", "root"],
      ]),
    );
  });

  it("finds a parent id or returns undefined when absent", () => {
    expect(findParentId(root, "a1")).toBe("a");
    expect(findParentId(root, "missing")).toBeUndefined();
  });

  it("short-circuits traversal once the parent is discovered", () => {
    const deepRoot = {
      id: "root",
      children: [
        {
          id: "left",
          children: [{ id: "left-child", children: [] }],
        },
        {
          id: "right",
          children: [{ id: "target", children: [] }],
        },
      ],
    };

    expect(findParentId(deepRoot, "target")).toBe("right");
  });
});
