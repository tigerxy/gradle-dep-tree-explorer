import { describe, it, expect } from "vitest";
import { exportDiffGraph } from "../../../src/lib/export/exportDiffGraph";
import type { DiffNode } from "../../../src/lib/types";
import { computeDescendantCounts } from "../../../src/lib/tree/descendants";

function buildNode(
  id: string,
  name: string,
  status: DiffNode["status"],
  children: DiffNode[] = [],
  depth = 0,
): DiffNode {
  return {
    id,
    name,
    status,
    declaredVersion: "1.0.0",
    resolvedVersion: "1.0.0",
    children,
    depth,
    descendantCount: 0,
  };
}

function assignDepths(node: DiffNode, depth = 0): void {
  node.depth = depth;
  node.children.forEach((child) => assignDepths(child, depth + 1));
}

function sampleTree(): DiffNode {
  const leafA = buildNode("a1", "androidx.core:core-ktx", "added");
  const leafB = buildNode("b1", "io.insert-koin:koin-compose", "changed");
  const child = buildNode("c1", "com.example:child", "removed", [leafA, leafB]);
  const root = buildNode("r1", "com.example:root", "unchanged", [child]);

  assignDepths(root);
  computeDescendantCounts(root);
  return root;
}

describe("exportDiffGraph", () => {
  it("includes all nodes exactly once and valid edges", () => {
    const root = sampleTree();
    const exportGraph = exportDiffGraph(root);

    const nodeIds = new Set(exportGraph.nodes.map((node) => node.id));
    expect(nodeIds.size).toBe(exportGraph.nodes.length);
    exportGraph.edges.forEach((edge) => {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    });
    expect(exportGraph.rootNodeId).toBe("root");
  });

  it("tracks summary counts by status", () => {
    const exportGraph = exportDiffGraph(sampleTree());
    expect(exportGraph.analysisSummary).toEqual({
      nodeCount: 4,
      addedCount: 1,
      removedCount: 1,
      changedCount: 1,
      unchangedCount: 1,
    });
  });

  it("preserves sibling order via siblingIndex", () => {
    const left = buildNode("l", "g:l", "added");
    const right = buildNode("r", "g:r", "removed");
    const parent = buildNode("p", "g:p", "unchanged", [left, right]);
    assignDepths(parent);
    computeDescendantCounts(parent);

    const exportGraph = exportDiffGraph(parent);
    const parentEdges = exportGraph.edges.filter((edge) => edge.from === "p");
    const toLeft = parentEdges.find((edge) => edge.to === "l");
    const toRight = parentEdges.find((edge) => edge.to === "r");

    expect(toLeft?.siblingIndex).toBe(0);
    expect(toRight?.siblingIndex).toBe(1);
  });
});
