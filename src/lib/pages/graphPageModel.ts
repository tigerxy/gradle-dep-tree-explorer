import type { FlattenedTree } from "../tree/flatten";
import { flattenTreePreorder } from "../tree/flatten";
import { buildSearchMatchIndex } from "../tree/search";
import type { DiffNode } from "../types";
import { textMatches } from "../utils";
import { createPageSearch, flattenTree, type DependencyPageModel } from "./shared";

export type GraphFilterId = "hideNonMatches";

export interface GraphPageModel extends DependencyPageModel<
  DiffNode,
  DiffNode,
  GraphFilterId,
  DiffNode
> {
  sourceRoot: DiffNode | null;
  visibleRoot: DiffNode | null;
  shouldHideNonMatches: boolean;
}

interface CreateGraphPageModelInput {
  root: DiffNode | null;
  searchQuery: string;
  hideNonMatches: boolean;
  treeIndex?: FlattenedTree<DiffNode> | null;
}

export function createGraphPageModel(input: CreateGraphPageModelInput): GraphPageModel {
  const search = createPageSearch<DiffNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const shouldHideNonMatches = input.hideNonMatches && search.isActive;
  const sourceRoot = input.root;
  const treeIndex = input.treeIndex ?? (sourceRoot ? flattenTreePreorder(sourceRoot) : null);
  const searchMatchIndex = shouldHideNonMatches
    ? buildSearchMatchIndex(treeIndex, search.matches)
    : null;

  function keep(node: DiffNode): boolean {
    if (node.name === "root:root") return true;
    const nodeIndex = treeIndex?.indexById.get(node.id);
    return nodeIndex !== undefined
      ? !!searchMatchIndex?.onMatchingBranchByIndex[nodeIndex]
      : search.matches(node);
  }

  function cloneIfVisible(node: DiffNode): DiffNode | null {
    if (!keep(node)) return null;

    return {
      ...node,
      children: node.children.map(cloneIfVisible).filter(Boolean) as DiffNode[],
    };
  }

  const visibleRoot = !sourceRoot
    ? null
    : shouldHideNonMatches
      ? cloneIfVisible(sourceRoot)
      : sourceRoot;

  return {
    search,
    filters: {
      hideNonMatches: {
        active: input.hideNonMatches,
        available: true,
      },
    },
    listing: {
      root: visibleRoot,
      items: flattenTree(visibleRoot),
    },
    hasData: !!sourceRoot,
    sourceRoot,
    visibleRoot,
    shouldHideNonMatches,
  };
}
