import type { DiffNode } from "../types";

export interface DiffGraphNode {
  id: string;
  kind: "module" | "project" | "synthetic-root";
  group: string | null;
  artifact: string | null;
  name: string;
  status: DiffNode["status"];
  declaredVersion: string | null;
  resolvedVersion: string | null;
  prevDeclaredVersion: string | null;
  prevResolvedVersion: string | null;
  depth: number;
  descendantCount: number;
}

export interface DiffGraphEdge {
  from: string;
  to: string;
  siblingIndex: number;
}

export interface DiffGraphExport {
  schemaVersion: "1.0";
  meta: {
    tool: "gradle-dep-tree-explorer";
    generatedAt: string;
  };
  analysisSummary: {
    nodeCount: number;
    addedCount: number;
    removedCount: number;
    changedCount: number;
    unchangedCount: number;
  };
  rootNodeId: string;
  nodes: DiffGraphNode[];
  edges: DiffGraphEdge[];
}

function valueOrNull(value?: string): string | null {
  if (!value) return null;
  return value === "" ? null : value;
}

function splitName(name: string): { group: string | null; artifact: string | null } {
  const [group, artifact] = name.split(":", 2);
  if (!artifact) return { group: null, artifact: null };
  return { group, artifact };
}

export function exportDiffGraph(root: DiffNode): DiffGraphExport {
  const rootNodeId = "root";
  const nodes: DiffGraphNode[] = [];
  const edges: DiffGraphEdge[] = [];

  let addedCount = 0;
  let removedCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  const stack: Array<{ node: DiffNode; parentId: string; siblingIndex: number }> = [
    { node: root, parentId: rootNodeId, siblingIndex: 0 },
  ];

  while (stack.length) {
    const { node, parentId, siblingIndex } = stack.pop() as {
      node: DiffNode;
      parentId: string;
      siblingIndex: number;
    };

    const { group, artifact } = splitName(node.name);

    nodes.push({
      id: node.id,
      kind: "module",
      group,
      artifact,
      name: node.name,
      status: node.status,
      declaredVersion: valueOrNull(node.declaredVersion),
      resolvedVersion: valueOrNull(node.resolvedVersion),
      prevDeclaredVersion: valueOrNull(node.prevDeclaredVersion),
      prevResolvedVersion: valueOrNull(node.prevResolvedVersion),
      depth: node.depth,
      descendantCount: node.descendantCount,
    });

    edges.push({
      from: parentId,
      to: node.id,
      siblingIndex,
    });

    if (node.status === "added") addedCount += 1;
    else if (node.status === "removed") removedCount += 1;
    else if (node.status === "changed") changedCount += 1;
    else unchangedCount += 1;

    for (let i = node.children.length - 1; i >= 0; i -= 1) {
      stack.push({ node: node.children[i], parentId: node.id, siblingIndex: i });
    }
  }

  const nodeCount = nodes.length;

  nodes.unshift({
    id: rootNodeId,
    kind: "synthetic-root",
    group: null,
    artifact: null,
    name: "root",
    status: "unchanged",
    declaredVersion: null,
    resolvedVersion: null,
    prevDeclaredVersion: null,
    prevResolvedVersion: null,
    depth: 0,
    descendantCount: nodeCount,
  });

  return {
    schemaVersion: "1.0",
    meta: {
      tool: "gradle-dep-tree-explorer",
      generatedAt: new Date().toISOString(),
    },
    analysisSummary: {
      nodeCount,
      addedCount,
      removedCount,
      changedCount,
      unchangedCount,
    },
    rootNodeId,
    nodes,
    edges,
  };
}
