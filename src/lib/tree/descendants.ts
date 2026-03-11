type CountedNode<TNode> = {
  descendantCount: number;
  children: TNode[];
};

export function computeDescendantCounts<TNode extends CountedNode<TNode>>(node: TNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + computeDescendantCounts(child);
  }
  node.descendantCount = count;
  return count;
}

export function collectAllNodeIds<TNode extends { id: string; children: TNode[] }>(
  root: TNode,
): Set<string> {
  const ids = new Set<string>();
  (function walk(node: TNode) {
    ids.add(node.id);
    node.children.forEach(walk);
  })(root);
  return ids;
}
