import { computeDescendantCounts } from "../tree/descendants";
import type { DependencyNode, DiffNode } from "../types";

interface IndexedChild {
  child: DependencyNode;
  index: number;
}

interface ChildBuckets {
  byExactVersion: Map<string, IndexedChild[]>;
  byResolvedVersion: Map<string, IndexedChild[]>;
  byDeclaredVersion: Map<string, IndexedChild[]>;
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

function appendToBucket(
  buckets: Map<string, IndexedChild[]>,
  key: string,
  entry: IndexedChild,
): void {
  const bucket = buckets.get(key);
  if (bucket) {
    bucket.push(entry);
  } else {
    buckets.set(key, [entry]);
  }
}

function buildChildBuckets(entries: IndexedChild[]): ChildBuckets {
  const byExactVersion = new Map<string, IndexedChild[]>();
  const byResolvedVersion = new Map<string, IndexedChild[]>();
  const byDeclaredVersion = new Map<string, IndexedChild[]>();

  entries.forEach((entry) => {
    appendToBucket(
      byExactVersion,
      `${entry.child.declaredVersion}|${entry.child.resolvedVersion}`,
      entry,
    );
    appendToBucket(byResolvedVersion, entry.child.resolvedVersion, entry);
    appendToBucket(byDeclaredVersion, entry.child.declaredVersion, entry);
  });

  return {
    byExactVersion,
    byResolvedVersion,
    byDeclaredVersion,
  };
}

function takeNextUnmatched(
  entries: IndexedChild[] | undefined,
  matchedOldIndices: Set<number>,
): IndexedChild | undefined {
  if (!entries?.length) return undefined;

  while (entries.length) {
    const entry = entries.shift() as IndexedChild;
    if (!matchedOldIndices.has(entry.index)) {
      return entry;
    }
  }

  return undefined;
}

function findMatchingOldChild(
  candidateEntries: IndexedChild[],
  candidateBuckets: ChildBuckets,
  matchedOldIndices: Set<number>,
  newChild: DependencyNode,
  oldSiblingCount: number,
  newSiblingCount: number,
): DependencyNode | undefined {
  const exactMatch = takeNextUnmatched(
    candidateBuckets.byExactVersion.get(`${newChild.declaredVersion}|${newChild.resolvedVersion}`),
    matchedOldIndices,
  );
  if (exactMatch) {
    matchedOldIndices.add(exactMatch.index);
    return exactMatch.child;
  }

  const resolvedMatch = takeNextUnmatched(
    candidateBuckets.byResolvedVersion.get(newChild.resolvedVersion),
    matchedOldIndices,
  );
  if (resolvedMatch) {
    matchedOldIndices.add(resolvedMatch.index);
    return resolvedMatch.child;
  }

  const declaredMatch = takeNextUnmatched(
    candidateBuckets.byDeclaredVersion.get(newChild.declaredVersion),
    matchedOldIndices,
  );
  if (declaredMatch) {
    matchedOldIndices.add(declaredMatch.index);
    return declaredMatch.child;
  }

  if (oldSiblingCount === 1 && newSiblingCount === 1) {
    const fallbackMatch = takeNextUnmatched(candidateEntries, matchedOldIndices);
    if (fallbackMatch) {
      matchedOldIndices.add(fallbackMatch.index);
      return fallbackMatch.child;
    }
  }

  return undefined;
}

function pairChildren(
  oldChildren: DependencyNode[],
  newChildren: DependencyNode[],
): Array<{ oldChild?: DependencyNode; newChild?: DependencyNode }> {
  const pairs = newChildren.map((newChild) => ({ newChild })) as Array<{
    oldChild?: DependencyNode;
    newChild?: DependencyNode;
  }>;
  const matchedOldIndices = new Set<number>();
  const oldChildrenByName = indexChildrenByName(oldChildren);
  const newChildrenByName = indexChildrenByName(newChildren);

  for (const [name, newCandidates] of newChildrenByName) {
    const oldCandidates = oldChildrenByName.get(name) ?? [];
    const oldCandidateBuckets = buildChildBuckets(oldCandidates);

    newCandidates.forEach(({ child, index }) => {
      pairs[index].oldChild = findMatchingOldChild(
        oldCandidates,
        oldCandidateBuckets,
        matchedOldIndices,
        child,
        oldCandidates.length,
        newCandidates.length,
      );
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
  const strictlyNew = newNode?.strictlyVersion || "";
  const declaredOld = oldNode?.declaredVersion || "";
  const resolvedOld = oldNode?.resolvedVersion || "";
  const strictlyOld = oldNode?.strictlyVersion || "";

  const existsOld = !!oldNode;
  const existsNew = !!newNode;
  const declared = existsNew ? declaredNew : declaredOld;
  const resolved = existsNew ? resolvedNew : resolvedOld;

  const status: "added" | "removed" | "changed" | "unchanged" =
    !existsOld && existsNew
      ? "added"
      : existsOld && !existsNew
        ? "removed"
        : declaredNew !== declaredOld || resolvedNew !== resolvedOld || strictlyNew !== strictlyOld
          ? "changed"
          : "unchanged";

  const merged: DiffNode = {
    id: existsNew ? newNode!.id : `removed|${oldNode!.id}`,
    name,
    declaredVersion: declared,
    resolvedVersion: resolved,
    strictlyVersion: existsNew ? newNode?.strictlyVersion : oldNode?.strictlyVersion,
    prevDeclaredVersion: existsOld && existsNew ? declaredOld : undefined,
    prevResolvedVersion: existsOld && existsNew ? resolvedOld : undefined,
    prevStrictlyVersion: existsOld && existsNew ? strictlyOld || undefined : undefined,
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
    strictlyVersion: node.strictlyVersion,
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
