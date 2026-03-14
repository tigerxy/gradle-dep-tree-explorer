import { flattenTreePreorder, type FlattenedTree } from "../tree/flatten";
import type { DependencyNode } from "../types";

export function indexNodes(root: DependencyNode): {
  nodeIndexByGA: Map<string, DependencyNode[]>;
  allNodes: DependencyNode[];
  treeIndex: FlattenedTree<DependencyNode>;
} {
  const treeIndex = flattenTreePreorder(root);
  const nodeIndexByGA = new Map<string, DependencyNode[]>();
  const allNodes = treeIndex.nodes;

  for (let index = 0; index < allNodes.length; index += 1) {
    const node = allNodes[index];
    if (node.name && node.name !== "root:root") {
      if (!nodeIndexByGA.has(node.name)) nodeIndexByGA.set(node.name, []);
      nodeIndexByGA.get(node.name)!.push(node);
    }
  }

  return { nodeIndexByGA, allNodes, treeIndex };
}
