import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import TreeNode from "../../src/components/TreeNode.svelte";
import type { DiffNode } from "../../src/lib/types";
import { state } from "../../src/lib/stores";
import { createDiffTreePageModel } from "../../src/lib/pages/diffTreePageModel";
import { get } from "svelte/store";

function makeNode(overrides: Partial<DiffNode> = {}): DiffNode {
  return {
    id: overrides.id || "n1",
    name: overrides.name || "com.example:lib",
    declaredVersion: overrides.declaredVersion ?? "1.0.0",
    resolvedVersion: overrides.resolvedVersion ?? "1.0.0",
    children: overrides.children || [],
    depth: overrides.depth ?? 1,
    status: overrides.status ?? "unchanged",
    descendantCount: overrides.descendantCount ?? 0,
    prevDeclaredVersion: overrides.prevDeclaredVersion,
    prevResolvedVersion: overrides.prevResolvedVersion,
  };
}

function createPage(node: DiffNode) {
  const storeState = get(state);
  return createDiffTreePageModel({
    root: node,
    oldRootAvailable: storeState.diffAvailable,
    searchQuery: storeState.searchQuery,
    favorites: storeState.favorites,
    treeIndex: null,
    filters: {
      added: false,
      removed: false,
      changed: false,
      unchanged: false,
      favorites: false,
    },
  });
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
    parentIdsById: new Map(),
  }));
});

describe("TreeNode tags", () => {
  it("shows fallback version tag when no diff", async () => {
    // Current UI displays the declaredVersion in the fallback tag
    const node = makeNode({ declaredVersion: "9.9.9", status: "unchanged" });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });
    const fallback = container.querySelector('[title="resolved version"]');
    expect(fallback).toBeTruthy();
    expect(fallback!.textContent).toContain("9.9.9");
  });

  it("shows a lock for strict versions and hides force when the selected version matches", async () => {
    const node = makeNode({
      declaredVersion: "{strictly 2.1.20}",
      resolvedVersion: "2.1.20",
      status: "unchanged",
    });
    const { container, queryByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });

    const strictTag = container.querySelector('[title="strict version constraint"]');
    expect(strictTag).toBeTruthy();
    expect(strictTag!.textContent).toContain("2.1.20");
    expect(strictTag!.textContent).not.toContain("{strictly 2.1.20}");
    expect(strictTag!.querySelector(".fa-lock")).toBeTruthy();
    expect(queryByText("force 2.1.20 → 2.1.20")).toBeFalsy();
  });

  it("shows status tag for added with diff", async () => {
    state.update((s) => ({ ...s, diffAvailable: true }));
    const node = makeNode({ resolvedVersion: "2.0.0", status: "added" });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
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
      props: { node, page: createPage(node) },
    });
    expect(getByText("decl 1.0.0 → 2.0.0")).toBeTruthy();
    // Current UI shows a 'force' tag for declared->resolved
    expect(getByText("force 2.0.0 → 2.0.2")).toBeTruthy();
  });
  it("shows forced update tag when declared and resolved differ", async () => {
    const node = makeNode({ declaredVersion: "1.0.0", resolvedVersion: "2.0.0" });
    const { getByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });
    expect(getByText("force 1.0.0 → 2.0.0")).toBeTruthy();
  });

  it("shows descendant count tag when provided", async () => {
    const node = makeNode({ descendantCount: 5 });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });
    const cnt = container.querySelector('span.tag.is-light.soft[title="recursive children"]');
    expect(cnt).toBeTruthy();
    expect((cnt as HTMLElement).textContent).toContain("5");
  });

  it("shows mvnrepo link for valid GA", async () => {
    const node = makeNode({ name: "org.example:artifact", resolvedVersion: "1.2.3" });
    const { container, getByText } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });
    expect(getByText("mvnrepo")).toBeTruthy();
    const a = container.querySelector('a[href^="https://mvnrepository.com/artifact/"]');
    expect(a).toBeTruthy();
  });

  it("jumps to the parent node using the parent id index", async () => {
    const parent = document.createElement("div");
    parent.id = "node-parent_1";
    const scrollIntoView = vi.fn();
    Object.defineProperty(parent, "scrollIntoView", { value: scrollIntoView, configurable: true });
    document.body.appendChild(parent);

    state.update((s) => ({
      ...s,
      parentIdsById: new Map([["child-1", "parent:1"]]),
    }));

    const node = makeNode({ id: "child-1" });
    const { getByTitle } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });

    await fireEvent.click(getByTitle("Jump to parent"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(parent.classList.contains("blink")).toBe(true);
    parent.remove();
  });

  it("still shows the parent button for non-root nodes without a prebuilt parent index", async () => {
    const node = makeNode({ id: "child-2", depth: 2 });
    const { getByTitle } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });

    expect(getByTitle("Jump to parent")).toBeTruthy();
  });

  it("toggles expansion from keyboard and favorite button clicks", async () => {
    const node = makeNode({
      id: "parent",
      depth: 1,
      children: [makeNode({ id: "child", depth: 2, name: "org.example:child" })],
      descendantCount: 1,
    });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });

    const row = container.querySelector('[role="button"]') as HTMLElement;
    expect(row.getAttribute("aria-expanded")).toBe("false");

    await fireEvent.keyDown(row, { key: "Enter", code: "Enter" });
    expect(row.getAttribute("aria-expanded")).toBe("true");

    await fireEvent.keyDown(row, { key: " ", code: "Space" });
    expect(row.getAttribute("aria-expanded")).toBe("false");

    const toggleButtons = container.querySelectorAll('button[title="Toggle favorite"]');
    await fireEvent.click(toggleButtons[0] as HTMLButtonElement);
    expect(Array.from(get(state).favorites)).toContain(node.name);
  });

  it("omits the mvnrepo tag for root and virtual nodes and safely ignores missing parents", async () => {
    const rootNode = makeNode({ name: "root:root", depth: 0 });
    const virtualNode = makeNode({ id: "virtual", name: "virtual:test", depth: 1 });

    const { container, rerender, queryByText, getByTitle } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node: rootNode, page: createPage(rootNode) },
    });
    expect(queryByText("mvnrepo")).toBeFalsy();

    await rerender({ node: virtualNode, page: createPage(virtualNode) });
    expect(queryByText("mvnrepo")).toBeFalsy();

    await fireEvent.click(getByTitle("Jump to parent"));
    expect(container.querySelector(".blink")).toBeFalsy();
  });

  it("ignores non-activation keys on rows", async () => {
    const node = makeNode({
      id: "keyboard",
      depth: 1,
      children: [makeNode({ id: "kid", depth: 2 })],
      descendantCount: 1,
    });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });

    const row = container.querySelector('[role="button"]') as HTMLElement;
    await fireEvent.keyDown(row, { key: "Escape", code: "Escape" });
    expect(row.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders favorite state when already favorited", async () => {
    state.update((s) => ({ ...s, favorites: new Set(["fav:lib"]) }));
    const node = makeNode({ name: "fav:lib" });
    const { container } = render(TreeNode, {
      target: document.getElementById("app")!,
      props: { node, page: createPage(node) },
    });
    const favBtn = container.querySelector('button[title="Toggle favorite"]') as HTMLButtonElement;
    expect(favBtn.classList.contains("fav")).toBe(true);
  });
});
