import { describe, it, expect } from "vitest";
import { parseGradleTree, computeDiff, computeForcedUpdates } from "../../src/lib/logic";
import fs from "node:fs";
import path from "node:path";
import type { DepNode } from "../../src/lib/types";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

function findChildByName(node: DepNode, name: string): DepNode | undefined {
  return (node.children || []).find((c) => c.name === name);
}

function findByPath(root: DepNode, names: string[]): DepNode | undefined {
  // Try strict path first, then fallback to a deep search for first segment
  let cur: DepNode | undefined = root;
  for (const n of names) {
    if (!cur) return undefined;
    let next = findChildByName(cur, n);
    if (!next) {
      // fallback: deep search for this segment anywhere below
      const stack: DepNode[] = [...(cur.children || [])];
      while (stack.length && !next) {
        const node = stack.shift()!;
        if (node.name === n) {
          next = node;
          break;
        }
        stack.push(...(node.children || []));
      }
    }
    cur = next;
  }
  return cur;
}

function findAnywhere(root: DepNode, name: string): DepNode | undefined {
  const stack: DepNode[] = [root];
  while (stack.length) {
    const n = stack.shift()!;
    if (n.name === name) return n;
    stack.push(...(n.children || []));
  }
  return undefined;
}

describe("logic: computeDiff merge", () => {
  const oldText = readSample("gradle-old.txt");
  const newText = readSample("gradle-new.txt");
  const oldRoot = parseGradleTree(oldText);
  const newRoot = parseGradleTree(newText);
  const { mergedRoot } = computeDiff(oldRoot, newRoot);

  it("marks koin-androidx-compose as changed with no duplicate removed", () => {
    const koin = findChildByName(mergedRoot, "io.insert-koin:koin-androidx-compose");
    expect(koin?.status).toBe("changed");
    const dupRemoved = (mergedRoot.children || []).filter(
      (c) => c.name === "io.insert-koin:koin-androidx-compose" && c.status === "removed",
    );
    expect(dupRemoved.length).toBe(0);
  });

  it("shows removed transitive deps under koin (runtime and viewmodel-compose)", () => {
    const koin = findChildByName(mergedRoot, "io.insert-koin:koin-androidx-compose");
    const runtime = koin && findAnywhere(koin, "androidx.compose.runtime:runtime");
    const vmc = koin && findAnywhere(koin, "androidx.lifecycle:lifecycle-viewmodel-compose");
    expect(runtime?.status).toBe("removed");
    expect(vmc?.status).toBe("removed");
  });

  it("marks lifecycle-viewmodel-ktx at root as added", () => {
    const vmKtx = findChildByName(mergedRoot, "androidx.lifecycle:lifecycle-viewmodel-ktx");
    expect(vmKtx?.status).toBe("added");
  });

  it("propagates previous versions on changed nodes", () => {
    const koin = findChildByName(mergedRoot, "io.insert-koin:koin-androidx-compose");
    expect(koin?.prevResolvedVersion).toBe("4.0.4");
    expect(koin?.resolvedVersion).toBe("4.1.0");
  });
});

describe("logic: computeForcedUpdates", () => {
  const oldText = readSample("gradle-old.txt");
  const newText = readSample("gradle-new.txt");
  const oldRoot = parseGradleTree(oldText);
  const newRoot = parseGradleTree(newText);
  const { mergedRoot } = computeDiff(oldRoot, newRoot);

  it("finds forced updates for annotation and kotlin", () => {
    const { forcedUpdates } = computeForcedUpdates(mergedRoot);
    expect(forcedUpdates.has("androidx.annotation:annotation")).toBe(true);
    expect(forcedUpdates.has("org.jetbrains.kotlin:kotlin-stdlib")).toBe(true);
    const ok = forcedUpdates.get("org.jetbrains.kotlin:kotlin-stdlib");
    expect(ok?.resolved).toBe("2.1.20");
    expect(Array.from(ok?.declared || [])).toContain("2.0.21");
  });
});
