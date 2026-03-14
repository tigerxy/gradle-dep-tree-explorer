import { computeDescendantCounts } from "../tree/descendants";
import type { DependencyNode, DiffNode } from "../types";

interface IndexedChild {
  child: DependencyNode;
  index: number;
}

function indexChildrenByName(children: DependencyNode[]): Map<string, IndexedChild[]> {
  const byName = new Map<string, IndexedChild[]>();

  children.forEach((child, index) => {
    const bucket = byName.get(child.name);
    const entry = { child, index };

    if (bucket) {
      bucket.push(entry);
    } else {
      byName.set(child.name, [entry]);
    }
  });

  return byName;
}

function findMatchingOldChild(
  candidateEntries: IndexedChild[] | undefined,
  matchedOldIndices: Set<number>,
  newChild: DependencyNode,
  oldSiblingCount: number,
  newSiblingCount: number,
): DependencyNode | undefined {
  if (!candidateEntries?.length) return undefined;

  const matchPredicates = [
    (oldChild: DependencyNode) =>
      oldChild.declaredVersion === newChild.declaredVersion &&
      oldChild.resolvedVersion === newChild.resolvedVersion,
    (oldChild: DependencyNode) => oldChild.resolvedVersion === newChild.resolvedVersion,
    (oldChild: DependencyNode) => oldChild.declaredVersion === newChild.declaredVersion,
    () => oldSiblingCount === 1 && newSiblingCount === 1,
  ];

  for (const predicate of matchPredicates) {
    const match = candidateEntries.find(
      ({ child, index }) => !matchedOldIndices.has(index) && predicate(child),
    );
    if (match) {
      matchedOldIndices.add(match.index);
      return match.child;
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
  const oldChildrenByName = indexChildrenByName(oldChildren);
  const newChildrenByName = indexChildrenByName(newChildren);

  for (const newChild of newChildren) {
    const oldCandidates = oldChildrenByName.get(newChild.name);
    pairs.push({
      oldChild: findMatchingOldChild(
        oldCandidates,
        matchedOldIndices,
        newChild,
        oldCandidates?.length ?? 0,
        newChildrenByName.get(newChild.name)?.length ?? 0,
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
