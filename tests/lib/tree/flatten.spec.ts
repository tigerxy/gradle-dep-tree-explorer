import { describe, expect, it } from "vitest";
import {
  flattenTreePreorder,
  getChildIndexes,
  getSubtreeIndexes,
  isIndexInSubtree,
  parseGradleTree,
} from "../../../src/lib/logic";
import fs from "node:fs";
import path from "node:path";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("tree/flatten", () => {
  it("flattens a small tree in preorder and preserves parent indexes", () => {
    const root = {
      id: "root",
      children: [
        {
          id: "a",
          children: [{ id: "a1", children: [] }],
        },
        {
          id: "b",
          children: [],
        },
      ],
    };

    const flattened = flattenTreePreorder(root);

    expect(flattened.ids).toEqual(["root", "a", "a1", "b"]);
    expect(flattened.parentIndexByIndex).toEqual([-1, 0, 1, 0]);
    expect(flattened.depthByIndex).toEqual([0, 1, 2, 1]);
    expect(flattened.startByIndex).toEqual([0, 1, 2, 3]);
    expect(flattened.endByIndex).toEqual([4, 3, 3, 4]);
    expect(flattened.indexById.get("a1")).toBe(2);
    expect(getChildIndexes(flattened, 0)).toEqual([1, 3]);
    expect(getChildIndexes(flattened, 1)).toEqual([2]);
    expect(getSubtreeIndexes(flattened, 1)).toEqual([1, 2]);
    expect(isIndexInSubtree(flattened, 1, 2)).toBe(true);
    expect(isIndexInSubtree(flattened, 1, 3)).toBe(false);
  });

  it("flattens a medium dependency tree without changing node identity", () => {
    const root = parseGradleTree(readSample("gradle-new.txt"));
    const flattened = flattenTreePreorder(root);

    expect(flattened.nodes[0]).toBe(root);
    expect(flattened.ids[0]).toBe(root.id);
    expect(flattened.nodes).toHaveLength(root.descendantCount + 1);
    expect(flattened.startByIndex[0]).toBe(0);
    expect(flattened.endByIndex[0]).toBe(flattened.nodes.length);
    expect(getChildIndexes(flattened, 0)).toHaveLength(root.children.length);

    for (const child of root.children) {
      const childIndex = flattened.indexById.get(child.id);
      expect(childIndex).toBeDefined();
      expect(flattened.parentIndexByIndex[childIndex as number]).toBe(0);
      expect(isIndexInSubtree(flattened, 0, childIndex as number)).toBe(true);
      expect(flattened.endByIndex[childIndex as number]).toBeGreaterThan(childIndex as number);
    }
  });
});
