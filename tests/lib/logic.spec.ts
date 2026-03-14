import { describe, it, expect } from "vitest";
import {
  parseGradleTree,
  createUnchangedDiff,
  computeDiff,
  collectAllNodeIds,
  flattenTreePreorder,
  getSubtreeIndexes,
  findParentId,
} from "../../src/lib/logic";
import type { DependencyNode } from "../../src/lib/types";

describe("logic barrel exports", () => {
  it("exposes parsing and diff helpers", () => {
    const oldRoot = parseGradleTree("+--- com.acme:lib:1.0.0");
    const newRoot = parseGradleTree("+--- com.acme:lib:2.0.0");

    const unchanged = createUnchangedDiff(newRoot);
    const diff = computeDiff(oldRoot, newRoot);

    expect(unchanged.mergedRoot?.children[0].status).toBe("unchanged");
    expect(diff.mergedRoot?.children[0].status).toBe("changed");
  });

  it("exposes tree navigation helpers", () => {
    const root = parseGradleTree(
      [
        "+--- com.acme:parent:1.0.0",
        "\\--- com.acme:child:1.0.0",
        "     \\--- com.acme:leaf:1.0.0",
      ].join("\n"),
    );

    const ids = collectAllNodeIds(root);
    expect(ids.size).toBe(4);

    const flattened = flattenTreePreorder(root as DependencyNode);
    const subtree = getSubtreeIndexes(flattened, 1);
    expect(subtree).toEqual([1]);
    expect(findParentId(root as DependencyNode, root.children[0].id)).toBe(root.id);
  });
});
