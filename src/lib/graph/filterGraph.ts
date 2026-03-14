import type { FlattenedTree } from "../tree/flatten";
import type { SharedDiffFilters } from "../pages/sharedDiffFilters";
import { flattenTreePreorder } from "../tree/flatten";
import { buildSearchMatchIndex } from "../tree/search";
import type { DiffNode } from "../types";
import { textMatches } from "../utils";

export interface FilterGraphInput {
  root: DiffNode | null;
  searchQuery: string;
  favorites: ReadonlySet<string>;
  oldRootAvailable: boolean;
  filters: SharedDiffFilters;
  treeIndex?: FlattenedTree<DiffNode> | null;
}

export interface FilterGraphResult {
  sourceRoot: DiffNode | null;
  visibleRoot: DiffNode | null;
  hasActiveVisibilityFilter: boolean;
}

export function filterGraph(input: FilterGraphInput): FilterGraphResult {
  const normalizedQuery = (input.searchQuery || "").trim();
  const searchIsActive = normalizedQuery.length > 0;
  const statusFiltersEnabled = input.oldRootAvailable;
  const filtersEnabled = statusFiltersEnabled || input.filters.favorites;
  const hasStatusFilter =
    input.filters.added ||
    input.filters.removed ||
    input.filters.changed ||
    input.filters.unchanged;
  const hasActiveVisibilityFilter = searchIsActive || hasStatusFilter || input.filters.favorites;
  const sourceRoot = input.root;
  const treeIndex = input.treeIndex ?? (sourceRoot ? flattenTreePreorder(sourceRoot) : null);
  const branchMatchIndex = hasActiveVisibilityFilter
    ? buildSearchMatchIndex(treeIndex, (node) => {
        const searchMatches = !searchIsActive || textMatches(normalizedQuery, node);
        return searchMatches && matchesOwnFilters(node);
      })
    : null;

  function matchesOwnFilters(node: DiffNode): boolean {
    if (!filtersEnabled) return true;

    const statusMatches = !hasStatusFilter
      ? true
      : (node.status === "added" && input.filters.added) ||
        (node.status === "removed" && input.filters.removed) ||
        (node.status === "changed" && input.filters.changed) ||
        (node.status === "unchanged" && input.filters.unchanged);
    const favoriteMatches = !input.filters.favorites || input.favorites.has(node.name);

    return statusMatches && favoriteMatches;
  }

  function keep(node: DiffNode): boolean {
    if (node.name === "root:root") return true;

    const nodeIndex = treeIndex?.indexById.get(node.id);
    return hasActiveVisibilityFilter
      ? nodeIndex !== undefined
        ? !!branchMatchIndex?.onMatchingBranchByIndex[nodeIndex]
        : (!searchIsActive || textMatches(normalizedQuery, node)) && matchesOwnFilters(node)
      : true;
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
      : hasActiveVisibilityFilter
        ? cloneIfVisible(sourceRoot)
        : sourceRoot,
    hasActiveVisibilityFilter,
  };
}
