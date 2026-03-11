import { computeDescendantCounts } from "../tree/descendants";
import type { DepNode } from "../types";

function mapByName(list: DepNode[] | undefined): Map<string, DepNode> {
  const byName = new Map<string, DepNode>();
  (list || []).forEach((node) => byName.set(node.name || "", node));
  return byName;
}

function mergeNodes(
  oldNode: DepNode | undefined,
  newNode: DepNode | undefined,
  parent: DepNode | undefined,
  depth: number,
): DepNode {
  const name = (newNode?.name || oldNode?.name) as string;
  const declaredNew = newNode?.declaredVersion || "";
  const resolvedNew = newNode?.resolvedVersion || "";
  const declaredOld = oldNode?.declaredVersion || "";
  const resolvedOld = oldNode?.resolvedVersion || "";

  const existsOld = !!oldNode;
  const existsNew = !!newNode;
  const declared = existsNew ? declaredNew : declaredOld;
  const resolved = existsNew ? resolvedNew : resolvedOld;

  const status: "added" | "removed" | "changed" | "unchanged" =
    !existsOld && existsNew
      ? "added"
      : existsOld && !existsNew
        ? "removed"
        : declaredNew !== declaredOld || resolvedNew !== resolvedOld
          ? "changed"
          : "unchanged";

  const merged: DepNode = {
    id: existsNew ? newNode!.id : `removed|${oldNode!.id}`,
    name,
    declaredVersion: declared,
    resolvedVersion: resolved,
    prevDeclaredVersion: existsOld && existsNew ? declaredOld : undefined,
    prevResolvedVersion: existsOld && existsNew ? resolvedOld : undefined,
    status,
    children: [],
    parent,
    depth,
    collapsed: newNode?.collapsed ?? oldNode?.collapsed ?? true,
    descendantCount: 0,
  };

  const oldChildren = mapByName(oldNode?.children);
  const newChildren = mapByName(newNode?.children);
  const keys = [
    ...Array.from(newChildren.keys()),
    ...Array.from(oldChildren.keys()).filter((key) => !newChildren.has(key)),
  ];

  for (const key of keys) {
    merged.children.push(mergeNodes(oldChildren.get(key), newChildren.get(key), merged, depth + 1));
  }

  return merged;
}

export function computeDiff(oldRoot: DepNode, newRoot: DepNode): { mergedRoot: DepNode } {
  const mergedRoot = mergeNodes(oldRoot, newRoot, undefined, 0);
  computeDescendantCounts(mergedRoot);
  return { mergedRoot };
}
