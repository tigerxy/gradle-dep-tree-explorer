import * as d3 from "d3";
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
  sourceRoot: DiffNode | null;
  visibleRoot: DiffNode | null;
  favorites: ReadonlySet<string>;
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

export function buildGraphModel(input: BuildGraphModelInput): GraphModel {
  if (!input.sourceRoot || !input.visibleRoot) {
    return {
      hasData: false,
      emptyMessage: EMPTY_MESSAGE,
      root: null,
      nodes: [],
      links: [],
    };
  }

  const graphRoot = d3.hierarchy(
    toGraphNode(input.visibleRoot, input.favorites),
    (node) => node.children,
  );
  d3.tree<GraphNode>().nodeSize([24, 200])(graphRoot);

  return {
    hasData: true,
    emptyMessage: EMPTY_MESSAGE,
    root: graphRoot,
    nodes: graphRoot.descendants(),
    links: graphRoot.links(),
  };
}
