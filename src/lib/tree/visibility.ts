import type { FlattenedTree } from "./flatten";

export interface VisibilityIndex {
  visibleNodeIndexes: number[];
  visibleNodeIds: Set<string>;
  visibleByIndex: boolean[];
}

export function computeVisibleNodeIndex<TNode extends { id: string }>(
  flattened: FlattenedTree<TNode> | null,
  isSelfVisible: (node: TNode, index: number) => boolean,
): VisibilityIndex {
  if (!flattened) {
    return {
      visibleNodeIndexes: [],
      visibleNodeIds: new Set<string>(),
      visibleByIndex: [],
    };
  }

  const visibleByIndex = new Array<boolean>(flattened.nodes.length).fill(false);

  for (let index = 0; index < flattened.nodes.length; index += 1) {
    visibleByIndex[index] = isSelfVisible(flattened.nodes[index], index);
  }

  for (let index = flattened.nodes.length - 1; index > 0; index -= 1) {
    if (!visibleByIndex[index]) continue;
    const parentIndex = flattened.parentIndexByIndex[index];
    if (parentIndex >= 0) {
      visibleByIndex[parentIndex] = true;
    }
  }

  const visibleNodeIndexes: number[] = [];
  const visibleNodeIds = new Set<string>();

  for (let index = 0; index < flattened.nodes.length; index += 1) {
    if (!visibleByIndex[index]) continue;
    visibleNodeIndexes.push(index);
    visibleNodeIds.add(flattened.ids[index]);
  }

  return {
    visibleNodeIndexes,
    visibleNodeIds,
    visibleByIndex,
  };
}
