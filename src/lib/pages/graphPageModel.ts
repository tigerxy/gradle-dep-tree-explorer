import type { FlattenedTree } from "../tree/flatten";
import { filterGraph } from "../graph/filterGraph";
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
  const { sourceRoot, visibleRoot, shouldHideNonMatches } = filterGraph({
    root: input.root,
    searchQuery: input.searchQuery,
    hideNonMatches: input.hideNonMatches,
    treeIndex: input.treeIndex,
  });

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
