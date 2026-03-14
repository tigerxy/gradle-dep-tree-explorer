import type { FlattenedTree } from "./flatten";
import { createFilterFlags, hasFilterFlag, type FilterFlags, setFilterFlag } from "./filterFlags";

export interface VisibilityIndex {
  visibleNodeIndexes: number[];
  visibleNodeIds: Set<string>;
  visibleFlags: FilterFlags;
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
      visibleFlags: createFilterFlags(0),
      visibleByIndex: [],
    };
  }

  const visibleFlags = createFilterFlags(flattened.nodes.length);

  for (let index = 0; index < flattened.nodes.length; index += 1) {
    if (isSelfVisible(flattened.nodes[index], index)) {
      setFilterFlag(visibleFlags, index);
    }
  }

  for (let index = flattened.nodes.length - 1; index > 0; index -= 1) {
    if (!hasFilterFlag(visibleFlags, index)) continue;
    const parentIndex = flattened.parentIndexByIndex[index];
    if (parentIndex >= 0) {
      setFilterFlag(visibleFlags, parentIndex);
    }
  }

  const visibleNodeIndexes: number[] = [];
  const visibleNodeIds = new Set<string>();
  const visibleByIndex = new Array<boolean>(flattened.nodes.length).fill(false);

  for (let index = 0; index < flattened.nodes.length; index += 1) {
    const isVisible = hasFilterFlag(visibleFlags, index);
    visibleByIndex[index] = isVisible;
    if (!isVisible) continue;
    visibleNodeIndexes.push(index);
    visibleNodeIds.add(flattened.ids[index]);
  }

  return {
    visibleNodeIndexes,
    visibleNodeIds,
    visibleFlags,
    visibleByIndex,
  };
}
