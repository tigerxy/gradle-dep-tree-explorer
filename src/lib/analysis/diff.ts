import { computeDescendantCounts } from "../tree/descendants";
import type { DependencyNode, DiffNode } from "../types";

function findMatchingOldChild(
  oldChildren: DependencyNode[],
  matchedOldIndices: Set<number>,
  newChild: DependencyNode,
  oldSiblingCount: number,
  newSiblingCount: number,
): DependencyNode | undefined {
  const candidateIndices = oldChildren
    .map((oldChild, index) => ({ oldChild, index }))
    .filter(
      ({ oldChild, index }) => !matchedOldIndices.has(index) && oldChild.name === newChild.name,
    );

  const matchPredicates = [
    (oldChild: DependencyNode) =>
      oldChild.declaredVersion === newChild.declaredVersion &&
      oldChild.resolvedVersion === newChild.resolvedVersion,
    (oldChild: DependencyNode) => oldChild.resolvedVersion === newChild.resolvedVersion,
    (oldChild: DependencyNode) => oldChild.declaredVersion === newChild.declaredVersion,
    () => oldSiblingCount === 1 && newSiblingCount === 1,
  ];

  for (const predicate of matchPredicates) {
    const match = candidateIndices.find(({ oldChild }) => predicate(oldChild));
    if (match) {
      matchedOldIndices.add(match.index);
      return match.oldChild;
    }
  }

  return undefined;
}

function pairChildren(
  oldChildren: DependencyNode[],
  newChildren: DependencyNode[],
): Array<{ oldChild?: DependencyNode; newChild?: DependencyNode }> {
  const pairs: Array<{ oldChild?: DependencyNode; newChild?: DependencyNode }> = [];
  const matchedOldIndices = new Set<number>();
  const oldNameCounts = new Map<string, number>();
  const newNameCounts = new Map<string, number>();

  oldChildren.forEach((child) => {
    oldNameCounts.set(child.name, (oldNameCounts.get(child.name) ?? 0) + 1);
  });
  newChildren.forEach((child) => {
    newNameCounts.set(child.name, (newNameCounts.get(child.name) ?? 0) + 1);
  });

  for (const newChild of newChildren) {
    pairs.push({
      oldChild: findMatchingOldChild(
        oldChildren,
        matchedOldIndices,
        newChild,
        oldNameCounts.get(newChild.name) ?? 0,
        newNameCounts.get(newChild.name) ?? 0,
      ),
      newChild,
    });
  }

  oldChildren.forEach((oldChild, index) => {
    if (!matchedOldIndices.has(index)) {
      pairs.push({ oldChild });
    }
  });

  return pairs;
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

  const childPairs = pairChildren(oldNode?.children ?? [], newNode?.children ?? []);

  for (const { oldChild, newChild } of childPairs) {
    merged.children.push(mergeNodes(oldChild, newChild, depth + 1));
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
