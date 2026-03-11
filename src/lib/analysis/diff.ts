import { computeDescendantCounts } from "../tree/descendants";
import type { DependencyNode, DiffNode } from "../types";

function mapByName(list: DependencyNode[]): Map<string, DependencyNode> {
  const byName = new Map<string, DependencyNode>();
  list.forEach((node) => byName.set(node.name, node));
  return byName;
}

function mergeNodes(
  oldNode: DependencyNode | undefined,
  newNode: DependencyNode | undefined,
  depth: number,
): DiffNode {
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

  const merged: DiffNode = {
    id: existsNew ? newNode!.id : `removed|${oldNode!.id}`,
    name,
    declaredVersion: declared,
    resolvedVersion: resolved,
    prevDeclaredVersion: existsOld && existsNew ? declaredOld : undefined,
    prevResolvedVersion: existsOld && existsNew ? resolvedOld : undefined,
    status,
    children: [],
    depth,
    descendantCount: 0,
  };

  const oldChildren = mapByName(oldNode?.children ?? []);
  const newChildren = mapByName(newNode?.children ?? []);
  const keys = [
    ...Array.from(newChildren.keys()),
    ...Array.from(oldChildren.keys()).filter((key) => !newChildren.has(key)),
  ];

  for (const key of keys) {
    merged.children.push(mergeNodes(oldChildren.get(key), newChildren.get(key), depth + 1));
  }

  return merged;
}

function toDiffNode(node: DependencyNode): DiffNode {
  const merged: DiffNode = {
    id: node.id,
    name: node.name,
    declaredVersion: node.declaredVersion,
    resolvedVersion: node.resolvedVersion,
    children: [],
    depth: node.depth,
    descendantCount: node.descendantCount,
    status: "unchanged",
  };

  merged.children = node.children.map((child) => toDiffNode(child));
  return merged;
}

export function createUnchangedDiff(root: DependencyNode): { mergedRoot: DiffNode } {
  const mergedRoot = toDiffNode(root);
  computeDescendantCounts(mergedRoot);
  return { mergedRoot };
}

export function computeDiff(
  oldRoot: DependencyNode,
  newRoot: DependencyNode,
): { mergedRoot: DiffNode } {
  const mergedRoot = mergeNodes(oldRoot, newRoot, 0);
  computeDescendantCounts(mergedRoot);
  return { mergedRoot };
}
