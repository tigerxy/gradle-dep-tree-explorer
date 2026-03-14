import { hasMatchOrDesc } from "../tree/navigation";
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
  hasSearchMatch: (node: DiffNode) => boolean;
  matchesOwnFilters: (node: DiffNode) => boolean;
  isNodeVisible: (node: DiffNode) => boolean;
}

interface CreateDiffTreePageModelInput {
  root: DiffNode | null;
  oldRootAvailable: boolean;
  searchQuery: string;
  favorites: ReadonlySet<string>;
  filters: DiffTreeFilterState;
}

export function createDiffTreePageModel(input: CreateDiffTreePageModelInput): DiffTreePageModel {
  const search = createPageSearch<DiffNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const statusFiltersEnabled = input.oldRootAvailable;
  const filtersEnabled = statusFiltersEnabled || input.filters.favorites;

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
    return hasMatchOrDesc(node, search.query, textMatches);
  }

  function isNodeVisible(node: DiffNode): boolean {
    if (search.isActive && !hasSearchMatch(node)) return false;
    if (matchesOwnFilters(node)) return true;
    return node.children.some(isNodeVisible);
  }

  const listingRoot = input.root;
  const listingItems = flattenTree(listingRoot).filter(isNodeVisible);

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
    hasSearchMatch,
    matchesOwnFilters,
    isNodeVisible,
  };
}
