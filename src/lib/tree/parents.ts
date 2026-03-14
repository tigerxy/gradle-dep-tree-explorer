import type { FlattenedTree } from "./flatten";

type TreeNodeWithId<TNode> = {
  id: string;
  children: TNode[];
};

export function buildParentIdsById<TNode extends TreeNodeWithId<TNode>>(
  root: TNode,
): Map<string, string> {
  const parentIdsById = new Map<string, string>();

  (function walk(node: TNode) {
    for (const child of node.children) {
      parentIdsById.set(child.id, node.id);
      walk(child);
    }
  })(root);

  return parentIdsById;
}

export function buildParentIdsByIdFromFlattened<TNode extends { id: string }>(
  flattened: FlattenedTree<TNode>,
): Map<string, string> {
  const parentIdsById = new Map<string, string>();

  for (let index = 1; index < flattened.ids.length; index += 1) {
    const parentIndex = flattened.parentIndexByIndex[index];
    parentIdsById.set(flattened.ids[index], flattened.ids[parentIndex]);
  }

  return parentIdsById;
}

export function findParentId<TNode extends TreeNodeWithId<TNode>>(
  root: TNode,
  targetId: string,
): string | undefined {
  let foundParentId: string | undefined;

  (function walk(node: TNode) {
    if (foundParentId) return;

    for (const child of node.children) {
      if (child.id === targetId) {
        foundParentId = node.id;
        return;
      }
      walk(child);
      if (foundParentId) return;
    }
  })(root);

  return foundParentId;
}
