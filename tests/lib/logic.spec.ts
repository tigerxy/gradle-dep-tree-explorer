import { describe, it, expect } from "vitest";
import { parseGradleTree, computeDiff, computeForcedUpdates } from "../../src/lib/logic";
import fs from "node:fs";
import path from "node:path";
import type { DependencyNode, DiffNode } from "../../src/lib/types";
import { domIdForNode } from "../../src/lib/utils";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

function findChildByName(node: DiffNode, name: string): DiffNode | undefined {
  return node.children.find((c) => c.name === name);
}

function findAnywhere(root: DiffNode, name: string): DiffNode | undefined {
  const stack: DiffNode[] = [root];
  while (stack.length) {
    const n = stack.shift()!;
    if (n.name === name) return n;
    stack.push(...n.children);
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

  it("matches duplicate dependency names by version before falling back to position", () => {
    const oldRoot = parseGradleTree(`
+--- com.example:duplicate:1.0.0
\\--- com.example:duplicate:2.0.0
`);
    const newRoot = parseGradleTree(`
+--- com.example:duplicate:2.0.0
\\--- com.example:duplicate:3.0.0
`);

    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const duplicates = mergedRoot.children.filter(
      (child) => child.name === "com.example:duplicate",
    );

    expect(duplicates).toHaveLength(3);
    expect(duplicates[0]).toMatchObject({
      declaredVersion: "2.0.0",
      resolvedVersion: "2.0.0",
      prevDeclaredVersion: "2.0.0",
      prevResolvedVersion: "2.0.0",
      status: "unchanged",
    });
    expect(duplicates[1]).toMatchObject({
      declaredVersion: "3.0.0",
      resolvedVersion: "3.0.0",
      status: "added",
    });
    expect(duplicates[2]).toMatchObject({
      declaredVersion: "1.0.0",
      resolvedVersion: "1.0.0",
      status: "removed",
    });
  });

  it("keeps duplicate matching stable when declared versions change but resolved versions still align", () => {
    const oldRoot = parseGradleTree(`
+--- com.example:duplicate:1.0.0 -> 2.0.0
\\--- com.example:duplicate:2.0.0 -> 3.0.0
`);
    const newRoot = parseGradleTree(`
+--- com.example:duplicate:1.1.0 -> 2.0.0
\\--- com.example:duplicate:2.1.0 -> 3.0.0
`);

    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const duplicates = mergedRoot.children.filter(
      (child) => child.name === "com.example:duplicate",
    );

    expect(duplicates).toHaveLength(2);
    expect(duplicates[0]).toMatchObject({
      declaredVersion: "1.1.0",
      resolvedVersion: "2.0.0",
      prevDeclaredVersion: "1.0.0",
      prevResolvedVersion: "2.0.0",
      status: "changed",
    });
    expect(duplicates[1]).toMatchObject({
      declaredVersion: "2.1.0",
      resolvedVersion: "3.0.0",
      prevDeclaredVersion: "2.0.0",
      prevResolvedVersion: "3.0.0",
      status: "changed",
    });
  });
});

describe("logic: computeForcedUpdates", () => {
  const newText = readSample("gradle-new.txt");
  const newRoot: DependencyNode = parseGradleTree(newText);

  it("finds forced updates for annotation and kotlin", () => {
    const { forcedUpdates } = computeForcedUpdates(newRoot);
    expect(forcedUpdates.has("androidx.annotation:annotation")).toBe(true);
    expect(forcedUpdates.has("org.jetbrains.kotlin:kotlin-stdlib")).toBe(true);
    const ok = forcedUpdates.get("org.jetbrains.kotlin:kotlin-stdlib");
    expect(ok?.resolved).toBe("2.1.20");
    expect(Array.from(ok?.declared || [])).toContain("2.0.21");
  });
});

describe("logic: parseGradleTree ids", () => {
  it("produces identical node ids when parsing the same input twice", () => {
    const input = readSample("gradle-new.txt");
    const firstRoot = parseGradleTree(input);
    const secondRoot = parseGradleTree(input);

    const collectIds = (root: DependencyNode): string[] => {
      const ids: string[] = [];
      const stack: DependencyNode[] = [root];
      while (stack.length) {
        const node = stack.shift()!;
        ids.push(node.id);
        stack.unshift(...node.children);
      }
      return ids;
    };

    expect(collectIds(firstRoot)).toEqual(collectIds(secondRoot));
  });

  it("uses stable DOM-safe ids derived from deterministic node ids", () => {
    const root = parseGradleTree(readSample("gradle-new.txt"));
    const kotlinStdlib = root.children.find(
      (child) => child.name === "org.jetbrains.kotlin:kotlin-stdlib",
    );

    expect(kotlinStdlib?.id).toBe("root/org.jetbrains.kotlin-kotlin-stdlib@2.1.20:0");
    expect(domIdForNode(kotlinStdlib)).toBe(
      "node-root_org_jetbrains_kotlin-kotlin-stdlib_2_1_20_0",
    );
  });
});
