import type { FlattenedTree } from "../tree/flatten";
import { filterGraph } from "../graph/filterGraph";
import type { DiffNode } from "../types";
import { textMatches } from "../utils";
import type { SharedDiffFilters, SharedDiffFilterId } from "./sharedDiffFilters";
import { createPageSearch, flattenTree, type DependencyPageModel } from "./shared";

export type GraphFilterId = SharedDiffFilterId;

export interface GraphPageModel extends DependencyPageModel<
  DiffNode,
  DiffNode,
  GraphFilterId,
  DiffNode
> {
  sourceRoot: DiffNode | null;
  visibleRoot: DiffNode | null;
  hasActiveVisibilityFilter: boolean;
  statusFiltersEnabled: boolean;
}

interface CreateGraphPageModelInput {
  root: DiffNode | null;
  searchQuery: string;
  oldRootAvailable: boolean;
  favorites: ReadonlySet<string>;
  filters: SharedDiffFilters;
  treeIndex?: FlattenedTree<DiffNode> | null;
}

export function createGraphPageModel(input: CreateGraphPageModelInput): GraphPageModel {
  const search = createPageSearch<DiffNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const { sourceRoot, visibleRoot, hasActiveVisibilityFilter } = filterGraph({
    root: input.root,
    searchQuery: input.searchQuery,
    oldRootAvailable: input.oldRootAvailable,
    favorites: input.favorites,
    filters: input.filters,
    treeIndex: input.treeIndex,
  });
  const statusFiltersEnabled = input.oldRootAvailable;

  return {
    search,
    filters: {
      added: { active: input.filters.added, available: statusFiltersEnabled },
      removed: { active: input.filters.removed, available: statusFiltersEnabled },
      changed: { active: input.filters.changed, available: statusFiltersEnabled },
      unchanged: { active: input.filters.unchanged, available: statusFiltersEnabled },
      favorites: { active: input.filters.favorites, available: true },
    },
    listing: {
      root: visibleRoot,
      items: flattenTree(visibleRoot),
    },
    hasData: !!sourceRoot,
    sourceRoot,
    visibleRoot,
    hasActiveVisibilityFilter,
    statusFiltersEnabled,
  };
}
