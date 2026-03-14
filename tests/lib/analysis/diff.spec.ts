import { describe, expect, it } from "vitest";
import { computeDiff, createUnchangedDiff } from "../../../src/lib/analysis/diff";
import type { DependencyNode } from "../../../src/lib/types";

function node(
  id: string,
  name: string,
  declaredVersion: string,
  resolvedVersion: string,
  children: DependencyNode[] = [],
): DependencyNode {
  return {
    id,
    name,
    declaredVersion,
    resolvedVersion,
    children,
    depth: 0,
    descendantCount: 0,
  };
}

describe("analysis/diff", () => {
  it("creates an unchanged diff tree with copied children", () => {
    const root = node("root", "root:root", "", "", [
      node("a", "org.example:alpha", "1.0.0", "1.0.0"),
    ]);

    const { mergedRoot } = createUnchangedDiff(root);

    expect(mergedRoot).toMatchObject({
      id: "root",
      status: "unchanged",
      descendantCount: 1,
    });
    expect(mergedRoot.children[0]).toMatchObject({
      id: "a",
      status: "unchanged",
      descendantCount: 0,
    });
    expect(mergedRoot.children[0]).not.toBe(root.children[0]);
  });

  it("marks added, removed, changed, and unchanged nodes", () => {
    const oldRoot = node("root", "root:root", "", "", [
      node("same", "org.example:same", "1.0.0", "1.0.0"),
      node("change", "org.example:change", "1.0.0", "1.0.0"),
      node("remove", "org.example:remove", "1.0.0", "1.0.0"),
    ]);
    const newRoot = node("root", "root:root", "", "", [
      node("same-new", "org.example:same", "1.0.0", "1.0.0"),
      node("change-new", "org.example:change", "1.0.0", "2.0.0"),
      node("add", "org.example:add", "1.0.0", "1.0.0"),
    ]);

    const { mergedRoot } = computeDiff(oldRoot, newRoot);

    expect(mergedRoot.children.map((child) => [child.name, child.status])).toEqual([
      ["org.example:same", "unchanged"],
      ["org.example:change", "changed"],
      ["org.example:add", "added"],
      ["org.example:remove", "removed"],
    ]);
    expect(mergedRoot.children[1]).toMatchObject({
      prevResolvedVersion: "1.0.0",
      resolvedVersion: "2.0.0",
    });
    expect(mergedRoot.children[3]?.id).toBe("removed|remove");
  });

  it("matches duplicate names by declared version before falling back to single-position matching", () => {
    const oldRoot = node("root", "root:root", "", "", [
      node("a-old", "org.example:dup", "1.0.0", "9.0.0"),
      node("single-old", "org.example:single", "1.0.0", "1.0.0"),
    ]);
    const newRoot = node("root", "root:root", "", "", [
      node("a-new", "org.example:dup", "1.0.0", "10.0.0"),
      node("single-new", "org.example:single", "2.0.0", "2.0.0"),
    ]);

    const { mergedRoot } = computeDiff(oldRoot, newRoot);

    expect(mergedRoot.children[0]).toMatchObject({
      name: "org.example:dup",
      status: "changed",
      prevDeclaredVersion: "1.0.0",
      prevResolvedVersion: "9.0.0",
      resolvedVersion: "10.0.0",
    });
    expect(mergedRoot.children[1]).toMatchObject({
      name: "org.example:single",
      status: "changed",
      prevDeclaredVersion: "1.0.0",
      declaredVersion: "2.0.0",
    });
  });

  it("keeps wide sibling lists stable while matching by dependency name", () => {
    const oldChildren = Array.from({ length: 40 }, (_, index) =>
      node(`old-${index}`, `org.example:dep-${index}`, "1.0.0", "1.0.0"),
    );
    oldChildren.splice(20, 0, node("target-old", "org.example:target", "1.0.0", "1.0.0"));

    const newChildren = Array.from({ length: 40 }, (_, index) =>
      node(`new-${index}`, `org.example:dep-${index}`, "1.0.0", "1.0.0"),
    );
    newChildren.splice(20, 0, node("target-new", "org.example:target", "1.0.0", "2.0.0"));

    const { mergedRoot } = computeDiff(
      node("root", "root:root", "", "", oldChildren),
      node("root", "root:root", "", "", newChildren),
    );

    expect(mergedRoot.children).toHaveLength(41);
    expect(mergedRoot.children[20]).toMatchObject({
      name: "org.example:target",
      status: "changed",
      prevResolvedVersion: "1.0.0",
      resolvedVersion: "2.0.0",
    });
    expect(mergedRoot.children.filter((child) => child.status === "removed")).toHaveLength(0);
  });

  it("matches duplicate sibling buckets without reusing old nodes", () => {
    const oldRoot = node("root", "root:root", "", "", [
      node("dup-old-1", "org.example:dup", "1.0.0", "10.0.0"),
      node("dup-old-2", "org.example:dup", "2.0.0", "20.0.0"),
      node("dup-old-3", "org.example:dup", "3.0.0", "30.0.0"),
    ]);
    const newRoot = node("root", "root:root", "", "", [
      node("dup-new-2", "org.example:dup", "2.1.0", "20.0.0"),
      node("dup-new-4", "org.example:dup", "4.0.0", "40.0.0"),
      node("dup-new-1", "org.example:dup", "1.1.0", "10.0.0"),
    ]);

    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const duplicates = mergedRoot.children.filter((child) => child.name === "org.example:dup");

    expect(duplicates).toEqual([
      expect.objectContaining({
        declaredVersion: "2.1.0",
        resolvedVersion: "20.0.0",
        prevDeclaredVersion: "2.0.0",
        prevResolvedVersion: "20.0.0",
        status: "changed",
      }),
      expect.objectContaining({
        declaredVersion: "4.0.0",
        resolvedVersion: "40.0.0",
        status: "added",
      }),
      expect.objectContaining({
        declaredVersion: "1.1.0",
        resolvedVersion: "10.0.0",
        prevDeclaredVersion: "1.0.0",
        prevResolvedVersion: "10.0.0",
        status: "changed",
      }),
      expect.objectContaining({
        declaredVersion: "3.0.0",
        resolvedVersion: "30.0.0",
        status: "removed",
      }),
    ]);
  });
});
