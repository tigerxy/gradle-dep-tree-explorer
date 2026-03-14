import type { FlattenedTree } from "../tree/flatten";
import { flattenTreePreorder } from "../tree/flatten";
import { buildSearchMatchIndex } from "../tree/search";
import type { DiffNode } from "../types";
import { textMatches } from "../utils";

export interface FilterGraphInput {
  root: DiffNode | null;
  searchQuery: string;
  hideNonMatches: boolean;
  treeIndex?: FlattenedTree<DiffNode> | null;
}

export interface FilterGraphResult {
  sourceRoot: DiffNode | null;
  visibleRoot: DiffNode | null;
  shouldHideNonMatches: boolean;
}

export function filterGraph(input: FilterGraphInput): FilterGraphResult {
  const normalizedQuery = (input.searchQuery || "").trim();
  const shouldHideNonMatches = input.hideNonMatches && normalizedQuery.length > 0;
  const sourceRoot = input.root;
  const treeIndex = input.treeIndex ?? (sourceRoot ? flattenTreePreorder(sourceRoot) : null);
  const searchMatchIndex = shouldHideNonMatches
    ? buildSearchMatchIndex(treeIndex, (node) => textMatches(normalizedQuery, node))
    : null;

  function keep(node: DiffNode): boolean {
    if (node.name === "root:root") return true;

    const nodeIndex = treeIndex?.indexById.get(node.id);
    return nodeIndex !== undefined
      ? !!searchMatchIndex?.onMatchingBranchByIndex[nodeIndex]
      : textMatches(normalizedQuery, node);
  }

  function cloneIfVisible(node: DiffNode): DiffNode | null {
    if (!keep(node)) return null;

    return {
      ...node,
      children: node.children.map(cloneIfVisible).filter(Boolean) as DiffNode[],
    };
  }

  return {
    sourceRoot,
    visibleRoot: !sourceRoot
      ? null
      : shouldHideNonMatches
        ? cloneIfVisible(sourceRoot)
        : sourceRoot,
    shouldHideNonMatches,
  };
}
