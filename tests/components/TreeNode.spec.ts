import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/svelte";
import TreeNode from "../../src/components/TreeNode.svelte";
import type { DepNode } from "../../src/lib/types";
import { state } from "../../src/lib/stores";

function makeNode(overrides: Partial<DepNode> = {}): DepNode {
  return {
    id: overrides.id || "n1",
    name: overrides.name || "com.example:lib",
    declaredVersion: overrides.declaredVersion ?? "1.0.0",
    resolvedVersion: overrides.resolvedVersion ?? "1.0.0",
    children: overrides.children || [],
    parent: overrides.parent,
    depth: overrides.depth ?? 1,
    status: overrides.status,
    descendantCount: overrides.descendantCount,
    collapsed: overrides.collapsed ?? true,
    prevDeclaredVersion: overrides.prevDeclaredVersion,
    prevResolvedVersion: overrides.prevResolvedVersion,
  } as DepNode;
}

beforeEach(() => {
  state.update((s) => ({
    ...s,
    oldText: "",
    newText: "",
    oldRoot: null,
    newRoot: null,
    mergedRoot: null,
    diffAvailable: false,
    favorites: new Set<string>(),
    searchQuery: "",
    nodeIndexByGA: new Map(),
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
  }));
});

describe("TreeNode tags", () => {
  it("shows fallback version tag when no diff", async () => {
    // Current UI displays the declaredVersion in the fallback tag
    const node = makeNode({ declaredVersion: "9.9.9", status: "unchanged" });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, filtersEnabled: false, searchQuery: "" },
    });
    const fallback = container.querySelector('[title="resolved version"]');
    expect(fallback).toBeTruthy();
    expect(fallback!.textContent).toContain("9.9.9");
  });

  it("shows status tag for added with diff", async () => {
    state.update((s) => ({ ...s, diffAvailable: true }));
    const node = makeNode({ resolvedVersion: "2.0.0", status: "added" });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, filtersEnabled: true, searchQuery: "" },
    });
    const tag = container.querySelector(".tag.is-success");
    expect(tag).toBeTruthy();
    // Current UI displays declaredVersion in the status tag
    expect(tag!.textContent).toContain("1.0.0");
  });

  it("shows declared/forced change tags when status changed", async () => {
    state.update((s) => ({ ...s, diffAvailable: true }));
    const node = makeNode({
      status: "changed",
      prevDeclaredVersion: "1.0.0",
      declaredVersion: "2.0.0",
      prevResolvedVersion: "1.0.1",
      resolvedVersion: "2.0.2",
    });
    const { getByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node },
    });
    expect(getByText("decl 1.0.0 → 2.0.0")).toBeTruthy();
    // Current UI shows a 'force' tag for declared->resolved
    expect(getByText("force 2.0.0 → 2.0.2")).toBeTruthy();
  });
  it("shows forced update tag when declared and resolved differ", async () => {
    const node = makeNode({ declaredVersion: "1.0.0", resolvedVersion: "2.0.0" });
    const { getByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node },
    });
    expect(getByText("force 1.0.0 → 2.0.0")).toBeTruthy();
  });

  it("shows descendant count tag when provided", async () => {
    const node = makeNode({ descendantCount: 5 });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node },
    });
    const cnt = container.querySelector('span.tag.is-light.soft[title="recursive children"]');
    expect(cnt).toBeTruthy();
    expect((cnt as HTMLElement).textContent).toContain("5");
  });

  it("shows mvnrepo link for valid GA", async () => {
    const node = makeNode({ name: "org.example:artifact", resolvedVersion: "1.2.3" });
    const { container, getByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node },
    });
    expect(getByText("mvnrepo")).toBeTruthy();
    const a = container.querySelector('a[href^="https://mvnrepository.com/artifact/"]');
    expect(a).toBeTruthy();
  });
});
