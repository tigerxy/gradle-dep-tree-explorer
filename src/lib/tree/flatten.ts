type FlattenableTreeNode<TNode> = {
  id: string;
  children: TNode[];
};

export interface FlattenedTree<TNode> {
  nodes: TNode[];
  ids: string[];
  parentIndexByIndex: number[];
  depthByIndex: number[];
  // Each subtree occupies the contiguous preorder range [startByIndex[i], endByIndex[i]).
  startByIndex: number[];
  endByIndex: number[];
  indexById: Map<string, number>;
}

export function flattenTreePreorder<TNode extends FlattenableTreeNode<TNode>>(
  root: TNode,
): FlattenedTree<TNode> {
  const nodes: TNode[] = [];
  const ids: string[] = [];
  const parentIndexByIndex: number[] = [];
  const depthByIndex: number[] = [];
  const startByIndex: number[] = [];
  const endByIndex: number[] = [];
  const indexById = new Map<string, number>();
  const stack: Array<{ node: TNode; parentIndex: number; depth: number }> = [
    { node: root, parentIndex: -1, depth: 0 },
  ];

  while (stack.length) {
    const current = stack.pop() as { node: TNode; parentIndex: number; depth: number };
    const index = nodes.length;

    nodes.push(current.node);
    ids.push(current.node.id);
    parentIndexByIndex.push(current.parentIndex);
    depthByIndex.push(current.depth);
    startByIndex.push(index);
    endByIndex.push(index + 1);
    indexById.set(current.node.id, index);

    for (let i = current.node.children.length - 1; i >= 0; i -= 1) {
      stack.push({
        node: current.node.children[i],
        parentIndex: index,
        depth: current.depth + 1,
      });
    }
  }

  for (let index = nodes.length - 1; index > 0; index -= 1) {
    const parentIndex = parentIndexByIndex[index];
    endByIndex[parentIndex] = Math.max(endByIndex[parentIndex], endByIndex[index]);
  }

  return {
    nodes,
    ids,
    parentIndexByIndex,
    depthByIndex,
    startByIndex,
    endByIndex,
    indexById,
  };
}

export function getChildIndexes<TNode>(
  flattened: FlattenedTree<TNode>,
  parentIndex: number,
): number[] {
  const childIndexes: number[] = [];

  for (let index = 0; index < flattened.parentIndexByIndex.length; index += 1) {
    if (flattened.parentIndexByIndex[index] === parentIndex) {
      childIndexes.push(index);
    }
  }

  return childIndexes;
}

export function isIndexInSubtree<TNode>(
  flattened: FlattenedTree<TNode>,
  subtreeIndex: number,
  candidateIndex: number,
): boolean {
  return (
    flattened.startByIndex[subtreeIndex] <= candidateIndex &&
    candidateIndex < flattened.endByIndex[subtreeIndex]
  );
}

export function getSubtreeIndexes<TNode>(
  flattened: FlattenedTree<TNode>,
  subtreeIndex: number,
): number[] {
  const indexes: number[] = [];

  for (
    let index = flattened.startByIndex[subtreeIndex];
    index < flattened.endByIndex[subtreeIndex];
    index += 1
  ) {
    indexes.push(index);
  }

  return indexes;
}
