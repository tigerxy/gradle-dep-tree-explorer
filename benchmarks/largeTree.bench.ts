import { bench, describe } from "vitest";
import { buildSearchMatchIndex } from "../src/lib/tree/search";
import { flattenTreePreorder, type FlattenedTree } from "../src/lib/tree/flatten";
import { computeVisibleNodeIndex } from "../src/lib/tree/visibility";
import { createDiffTreePageModel } from "../src/lib/pages/diffTreePageModel";
import { computeDescendantCounts } from "../src/lib/tree/descendants";
import type { DiffNode } from "../src/lib/types";
import { textMatches } from "../src/lib/utils";

interface BenchmarkScenario {
  label: string;
  root: DiffNode;
  treeIndex: FlattenedTree<DiffNode>;
}

function createNode(index: number, depth: number): DiffNode {
  return {
    id: `node-${index}`,
    name: `com.example:lib-${index % 500}`,
    declaredVersion: `1.${index % 7}.0`,
    resolvedVersion: `1.${(index + 3) % 11}.0`,
    children: [],
    depth,
    descendantCount: 0,
    status:
      index % 7 === 0
        ? "changed"
        : index % 5 === 0
          ? "added"
          : index % 3 === 0
            ? "removed"
            : "unchanged",
    prevDeclaredVersion: `1.${(index + 1) % 7}.0`,
    prevResolvedVersion: `1.${(index + 2) % 11}.0`,
  };
}

function createSyntheticDiffTree(targetSize: number): DiffNode {
  const root = {
    ...createNode(0, -1),
    id: "root",
    name: "root:root",
    declaredVersion: "",
    resolvedVersion: "",
    prevDeclaredVersion: "",
    prevResolvedVersion: "",
    status: "unchanged" as const,
  };
  const queue: DiffNode[] = [root];
  let nextId = 1;

  while (queue.length && nextId < targetSize) {
    const parent = queue.shift() as DiffNode;
    const remaining = targetSize - nextId;
    const childCount = Math.min(4, remaining);

    for (let offset = 0; offset < childCount; offset += 1) {
      const child = createNode(nextId, parent.depth + 1);
      parent.children.push(child);
      queue.push(child);
      nextId += 1;
      if (nextId >= targetSize) break;
    }
  }

  computeDescendantCounts(root);
  return root;
}

function createScenario(size: number): BenchmarkScenario {
  const root = createSyntheticDiffTree(size);
  return {
    label: `${size.toLocaleString()} nodes`,
    root,
    treeIndex: flattenTreePreorder(root),
  };
}

const scenarios = [createScenario(1_000), createScenario(5_000), createScenario(25_000)];

describe("large tree benchmarks", () => {
  for (const scenario of scenarios) {
    bench(`flattenTreePreorder ${scenario.label}`, () => {
      flattenTreePreorder(scenario.root);
    });

    bench(`buildSearchMatchIndex ${scenario.label}`, () => {
      buildSearchMatchIndex(scenario.treeIndex, (node) => textMatches("lib-12", node));
    });

    bench(`computeVisibleNodeIndex ${scenario.label}`, () => {
      const searchMatchIndex = buildSearchMatchIndex(scenario.treeIndex, (node) =>
        textMatches("lib-12", node),
      );
      computeVisibleNodeIndex(
        scenario.treeIndex,
        (node, index) =>
          !!searchMatchIndex.onMatchingBranchByIndex[index] &&
          (node.status === "changed" || node.status === "added"),
      );
    });

    bench(`createDiffTreePageModel ${scenario.label}`, () => {
      createDiffTreePageModel({
        root: scenario.root,
        oldRootAvailable: true,
        searchQuery: "lib-12",
        favorites: new Set(["com.example:lib-12"]),
        treeIndex: scenario.treeIndex,
        filters: {
          added: true,
          removed: false,
          changed: true,
          unchanged: false,
          favorites: false,
        },
      });
    });
  }
});
