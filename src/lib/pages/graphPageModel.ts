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
}

export function createGraphPageModel(input: CreateGraphPageModelInput): GraphPageModel {
  const search = createPageSearch<DiffNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const shouldHideNonMatches = input.hideNonMatches && search.isActive;

  function keep(node: DiffNode): boolean {
    if (node.name === "root:root") return true;
    if (search.matches(node)) return true;
    return node.children.some(keep);
  }

  function cloneIfVisible(node: DiffNode): DiffNode | null {
    if (!keep(node)) return null;

    return {
      ...node,
      children: node.children.map(cloneIfVisible).filter(Boolean) as DiffNode[],
    };
  }

  const sourceRoot = input.root;
  const visibleRoot = !sourceRoot
    ? null
    : shouldHideNonMatches
      ? cloneIfVisible(sourceRoot)
      : structuredClone(sourceRoot);

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
