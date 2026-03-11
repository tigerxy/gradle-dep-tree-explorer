import type { DepNode } from "../types";

export function computeDescendantCounts(node: DepNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + computeDescendantCounts(child);
  }
  node.descendantCount = count;
  return count;
}

export function collectAllNodeIds(root: DepNode): Set<string> {
  const ids = new Set<string>();
  (function walk(node: DepNode) {
    ids.add(node.id);
    (node.children || []).forEach(walk);
  })(root);
  return ids;
}
