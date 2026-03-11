import type { DependencyNode } from "../types";

export function indexNodes(root: DependencyNode): {
  nodeIndexByGA: Map<string, DependencyNode[]>;
  allNodes: DependencyNode[];
} {
  const nodeIndexByGA = new Map<string, DependencyNode[]>();
  const allNodes: DependencyNode[] = [];

  (function walk(node: DependencyNode) {
    allNodes.push(node);
    if (node.name && node.name !== "root:root") {
      if (!nodeIndexByGA.has(node.name)) nodeIndexByGA.set(node.name, []);
      nodeIndexByGA.get(node.name)!.push(node);
    }
    node.children.forEach((child) => walk(child));
  })(root);

  return { nodeIndexByGA, allNodes };
}
