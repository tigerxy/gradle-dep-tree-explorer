import type { FlattenedTree } from "../tree/flatten";
import { flattenTreePreorder } from "../tree/flatten";
import { buildSearchMatchIndex } from "../tree/search";
import { computeVisibleNodeIndex } from "../tree/visibility";
import type { DiffNode } from "../types";
import { textMatches } from "../utils";
import { createPageSearch, flattenTree, type DependencyPageModel } from "./shared";

export type DiffTreeFilterId = "added" | "removed" | "changed" | "unchanged" | "favorites";

export interface DiffTreeFilterState {
  added: boolean;
  removed: boolean;
  changed: boolean;
  unchanged: boolean;
  favorites: boolean;
}

export interface DiffTreePageModel extends DependencyPageModel<
  DiffNode,
  DiffNode,
  DiffTreeFilterId,
  DiffNode
> {
  statusFiltersEnabled: boolean;
  filtersEnabled: boolean;
  matchingNodeIndexes: readonly number[];
  matchingAncestorIndexes: readonly number[];
  visibleNodeIndexes: readonly number[];
  matchingNodeIds: ReadonlySet<string>;
  matchingAncestorIds: ReadonlySet<string>;
  visibleNodeIds: ReadonlySet<string>;
  hasSearchMatch: (node: DiffNode) => boolean;
  matchesOwnFilters: (node: DiffNode) => boolean;
  isNodeVisible: (node: DiffNode) => boolean;
}

interface CreateDiffTreePageModelInput {
  root: DiffNode | null;
  oldRootAvailable: boolean;
  searchQuery: string;
  favorites: ReadonlySet<string>;
  treeIndex?: FlattenedTree<DiffNode> | null;
  filters: DiffTreeFilterState;
}

export function createDiffTreePageModel(input: CreateDiffTreePageModelInput): DiffTreePageModel {
  const search = createPageSearch<DiffNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const statusFiltersEnabled = input.oldRootAvailable;
  const filtersEnabled = statusFiltersEnabled || input.filters.favorites;
  const treeIndex = input.treeIndex ?? (input.root ? flattenTreePreorder(input.root) : null);
  const searchMatchIndex = search.isActive
    ? buildSearchMatchIndex(treeIndex, search.matches)
    : {
        matchingNodeIndexes: [],
        matchingAncestorIndexes: [],
        matchingNodeIds: new Set<string>(),
        matchingAncestorIds: new Set<string>(),
        directMatchByIndex: [],
        onMatchingBranchByIndex: [],
      };

  function matchesOwnFilters(node: DiffNode): boolean {
    if (!filtersEnabled) return true;

    const hasStatusFilter =
      input.filters.added ||
      input.filters.removed ||
      input.filters.changed ||
      input.filters.unchanged;
    const statusMatches = !hasStatusFilter
      ? true
      : (node.status === "added" && input.filters.added) ||
        (node.status === "removed" && input.filters.removed) ||
        (node.status === "changed" && input.filters.changed) ||
        (node.status === "unchanged" && input.filters.unchanged);
    const favoriteMatches = !input.filters.favorites || input.favorites.has(node.name);

    return statusMatches && favoriteMatches;
  }

  function hasSearchMatch(node: DiffNode): boolean {
    if (!search.isActive) return true;

    const nodeIndex = treeIndex?.indexById.get(node.id);
    return nodeIndex !== undefined ? !!searchMatchIndex.onMatchingBranchByIndex[nodeIndex] : false;
  }

  const visibilityIndex = computeVisibleNodeIndex(treeIndex, (node, index) => {
    const searchVisible = !search.isActive || !!searchMatchIndex.onMatchingBranchByIndex[index];
    return searchVisible && matchesOwnFilters(node);
  });

  function isNodeVisible(node: DiffNode): boolean {
    return visibilityIndex.visibleNodeIds.has(node.id);
  }

  const listingRoot = input.root;
  const listingItems = treeIndex
    ? visibilityIndex.visibleNodeIndexes.map((index) => treeIndex.nodes[index])
    : flattenTree(listingRoot).filter(isNodeVisible);

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
      root: listingRoot,
      items: listingItems,
    },
    hasData: !!listingRoot,
    statusFiltersEnabled,
    filtersEnabled,
    matchingNodeIndexes: searchMatchIndex.matchingNodeIndexes,
    matchingAncestorIndexes: searchMatchIndex.matchingAncestorIndexes,
    visibleNodeIndexes: visibilityIndex.visibleNodeIndexes,
    matchingNodeIds: searchMatchIndex.matchingNodeIds,
    matchingAncestorIds: searchMatchIndex.matchingAncestorIds,
    visibleNodeIds: visibilityIndex.visibleNodeIds,
    hasSearchMatch,
    matchesOwnFilters,
    isNodeVisible,
  };
}
