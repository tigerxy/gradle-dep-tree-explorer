import type { FlattenedTree } from "./flatten";

export interface SearchMatchIndex {
  matchingNodeIds: Set<string>;
  matchingAncestorIds: Set<string>;
}

export function buildSearchMatchIndex<TNode extends { id: string }>(
  flattened: FlattenedTree<TNode> | null,
  matches: (node: TNode) => boolean,
): SearchMatchIndex {
  if (!flattened) {
    return {
      matchingNodeIds: new Set<string>(),
      matchingAncestorIds: new Set<string>(),
    };
  }

  const matchingByIndex = new Array<boolean>(flattened.nodes.length).fill(false);
  const onMatchingBranchByIndex = new Array<boolean>(flattened.nodes.length).fill(false);

  for (let index = 0; index < flattened.nodes.length; index += 1) {
    const isMatch = matches(flattened.nodes[index]);
    matchingByIndex[index] = isMatch;
    onMatchingBranchByIndex[index] = isMatch;
  }

  for (let index = flattened.nodes.length - 1; index > 0; index -= 1) {
    if (!onMatchingBranchByIndex[index]) continue;
    const parentIndex = flattened.parentIndexByIndex[index];
    onMatchingBranchByIndex[parentIndex] = true;
  }

  const matchingNodeIds = new Set<string>();
  const matchingAncestorIds = new Set<string>();

  for (let index = 0; index < flattened.ids.length; index += 1) {
    if (matchingByIndex[index]) {
      matchingNodeIds.add(flattened.ids[index]);
    } else if (onMatchingBranchByIndex[index]) {
      matchingAncestorIds.add(flattened.ids[index]);
    }
  }

  return {
    matchingNodeIds,
    matchingAncestorIds,
  };
}
