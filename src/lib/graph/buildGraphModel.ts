import * as d3 from "d3";
import type { SharedDiffFilters } from "../pages/sharedDiffFilters";
import type { FlattenedTree } from "../tree/flatten";
import { filterGraph, type FilterGraphResult } from "./filterGraph";
import type { DiffNode, Status } from "../types";

export interface GraphNode {
  id: string;
  label: string;
  status: Status;
  children: GraphNode[];
}

export interface GraphModel {
  hasData: boolean;
  emptyMessage: string;
  root: d3.HierarchyNode<GraphNode> | null;
  nodes: d3.HierarchyNode<GraphNode>[];
  links: d3.HierarchyLink<GraphNode>[];
}

export interface BuildGraphModelInput {
  hasData: boolean;
  root: GraphNode | null;
}

export interface MemoizedGraphModelInput {
  root: DiffNode | null;
  searchQuery: string;
  oldRootAvailable: boolean;
  treeIndex?: FlattenedTree<DiffNode> | null;
  favorites: ReadonlySet<string>;
  filters: SharedDiffFilters;
}

const EMPTY_MESSAGE = "Parse a current dependency tree on the Input page to see the graph.";

function buildLabel(node: DiffNode, favorites: ReadonlySet<string>): string {
  const star = favorites.has(node.name) ? "★ " : "";

  if (node.name === "root:root") {
    return `${star}root`.trimStart();
  }

  return `${star}${node.name}${node.resolvedVersion ? ":" + node.resolvedVersion : ""}`;
}

function toGraphNode(node: DiffNode, favorites: ReadonlySet<string>): GraphNode {
  return {
    id: node.id,
    label: buildLabel(node, favorites),
    status: node.status,
    children: node.children.map((child) => toGraphNode(child, favorites)),
  };
}

export function buildGraphTree(
  root: DiffNode | null,
  favorites: ReadonlySet<string>,
): GraphNode | null {
  return root ? toGraphNode(root, favorites) : null;
}

export function buildGraphModel(input: BuildGraphModelInput): GraphModel {
  if (!input.hasData || !input.root) {
    return {
      hasData: false,
      emptyMessage: EMPTY_MESSAGE,
      root: null,
      nodes: [],
      links: [],
    };
  }

  const graphRoot = d3.hierarchy(input.root, (node) => node.children);
  d3.tree<GraphNode>().nodeSize([24, 200])(graphRoot);

  return {
    hasData: true,
    emptyMessage: EMPTY_MESSAGE,
    root: graphRoot,
    nodes: graphRoot.descendants(),
    links: graphRoot.links(),
  };
}

export function createMemoizedGraphModelBuilder() {
  let previousInput: MemoizedGraphModelInput | null = null;
  let previousFiltered: FilterGraphResult | null = null;
  let previousGraphRoot: GraphNode | null = null;
  let previousModel: GraphModel | null = null;

  return (input: MemoizedGraphModelInput): GraphModel => {
    const reusesFilter =
      previousInput?.root === input.root &&
      previousInput?.searchQuery === input.searchQuery &&
      previousInput?.oldRootAvailable === input.oldRootAvailable &&
      previousInput?.filters === input.filters &&
      previousInput?.treeIndex === input.treeIndex;

    const filtered = reusesFilter
      ? (previousFiltered as FilterGraphResult)
      : filterGraph({
          root: input.root,
          searchQuery: input.searchQuery,
          oldRootAvailable: input.oldRootAvailable,
          favorites: input.favorites,
          filters: input.filters,
          treeIndex: input.treeIndex,
        });

    const reusesGraphTree =
      reusesFilter &&
      previousInput?.favorites === input.favorites &&
      previousFiltered?.visibleRoot === filtered.visibleRoot;

    const graphRoot = reusesGraphTree
      ? previousGraphRoot
      : buildGraphTree(filtered.visibleRoot, input.favorites);

    const hasData = !!filtered.sourceRoot;
    const reusesModel =
      reusesGraphTree && previousModel?.hasData === hasData && previousGraphRoot === graphRoot;

    const model = reusesModel
      ? (previousModel as GraphModel)
      : buildGraphModel({
          hasData,
          root: graphRoot,
        });

    previousInput = input;
    previousFiltered = filtered;
    previousGraphRoot = graphRoot;
    previousModel = model;

    return model;
  };
}
