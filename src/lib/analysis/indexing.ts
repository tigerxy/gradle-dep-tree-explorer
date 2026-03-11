import type { DepNode } from "../types";

export function indexNodes(root: DepNode): {
  nodeIndexByGA: Map<string, DepNode[]>;
  allNodes: DepNode[];
} {
  const nodeIndexByGA = new Map<string, DepNode[]>();
  const allNodes: DepNode[] = [];

  (function walk(node: DepNode) {
    allNodes.push(node);
    if (node.name && node.name !== "root:root") {
      if (!nodeIndexByGA.has(node.name)) nodeIndexByGA.set(node.name, []);
      nodeIndexByGA.get(node.name)!.push(node);
    }
    (node.children || []).forEach((child) => walk(child));
  })(root);

  return { nodeIndexByGA, allNodes };
}
