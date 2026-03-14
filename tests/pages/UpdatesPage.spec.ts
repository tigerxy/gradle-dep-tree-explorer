import { describe, it, expect, vi } from "vitest";
import UpdatesPage from "../../src/pages/UpdatesPage.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import { state, updatesShowAll } from "../../src/lib/stores";
import {
  parseGradleTree,
  computeDiff,
  computeForcedUpdates,
  indexNodes,
  buildParentIdsById,
  findNodeByPath,
} from "../../src/lib/logic";
import { domIdForNode } from "../../src/lib/utils";
import type { DependencyNode, DiffNode, ForcedUpdateInfo } from "../../src/lib/types";
import fs from "node:fs";
import path from "node:path";
import { tick } from "svelte";

function read(file: string) {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("UpdatesPage", () => {
  it("lists forced updates and responds to Show all", async () => {
    const oldRoot = parseGradleTree(read("gradle-old.txt"));
    const newRoot = parseGradleTree(read("gradle-new.txt"));
    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const { nodeIndexByGA } = indexNodes(mergedRoot);
    const { forcedUpdates, gaToPaths } = computeForcedUpdates(mergedRoot);
    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot,
      newRoot,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA,
      gaToPaths,
      forcedUpdates,
      parentIdsById: buildParentIdsById(mergedRoot),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    const { getByLabelText, findAllByText } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });

    // By default only forced updates are shown; kotlin stdlib should be present (may appear multiple times in paths)
    const forcedKotlin = await findAllByText(/org\.jetbrains\.kotlin:kotlin-stdlib/);
    expect(forcedKotlin.length).toBeGreaterThan(0);

    // Toggle show all
    const cb = getByLabelText(
      "Show all dependencies (not only forced updates)",
    ) as HTMLInputElement;
    await fireEvent.click(cb);

    // Now a non-forced like androidx.core:core should also appear
    const coreMatches = await findAllByText(/androidx\.core:core/);
    expect(coreMatches.length).toBeGreaterThan(0);
  });

  it("Jump to Diff Tree expands the target path", async () => {
    const oldRoot = parseGradleTree(read("gradle-old.txt"));
    const newRoot = parseGradleTree(read("gradle-new.txt"));
    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const { nodeIndexByGA } = indexNodes(mergedRoot);
    const { forcedUpdates, gaToPaths } = computeForcedUpdates(mergedRoot);
    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot,
      newRoot,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA,
      gaToPaths,
      forcedUpdates,
      parentIdsById: buildParentIdsById(mergedRoot),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    // Render Diff tree and Updates so the jump can find elements
    const DiffTreePage = (await import("../../src/pages/DiffTreePage.svelte")).default;
    render(DiffTreePage, { target: document.getElementById("app")! });
    const { container } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });

    // Open all path lists (so buttons are present)
    container.querySelectorAll("summary").forEach((s) => (s as HTMLElement).click());

    const btnEl = container.querySelector(
      "details button.button.is-small.is-light",
    ) as HTMLButtonElement | null;
    expect(btnEl).toBeTruthy();
    const li = btnEl.closest("li")!;
    const pathText = (li.firstChild as Text).textContent!.trim();

    btnEl.click();
    await new Promise((r) => setTimeout(r, 150));

    const { node, ancestors } = findNodeByPath(mergedRoot, pathText);
    expect(node).toBeTruthy();
    ancestors.forEach((a) => {
      const row = document.querySelector(`[data-id="${a.id}"]`) as HTMLElement | null;
      expect(row).toBeTruthy();
      expect(row!.getAttribute("aria-expanded")).toBe("true");
    });
    const el = document.getElementById(domIdForNode({ id: node!.id }));
    expect(el).toBeTruthy();
  });

  it("shows empty states, filters by search, and toggles favorites", async () => {
    updatesShowAll.set(false);
    state.update(() => ({
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
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: null,
      analysisIssues: [],
    }));

    const emptyRoot = render(UpdatesPage, { target: document.getElementById("app")! });
    expect(emptyRoot.getByText("Parse a current dependency tree first.")).toBeTruthy();
    emptyRoot.unmount();

    const root = parseGradleTree("+--- com.example:plain:1.0.0");
    const plainNodes = root.children as DependencyNode[];
    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: root,
      mergedRoot: root as unknown as DiffNode,
      diffAvailable: false,
      favorites: new Set<string>(),
      searchQuery: "missing",
      nodeIndexByGA: new Map([["com.example:plain", plainNodes]]),
      gaToPaths: new Map([["com.example:plain", new Set(["com.example:plain:1.0.0"])]]),
      forcedUpdates: new Map(),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    const filtered = render(UpdatesPage, { target: document.getElementById("app")! });
    expect(filtered.getByText("No forced updates detected.")).toBeTruthy();
    filtered.unmount();

    state.update((s) => ({
      ...s,
      searchQuery: "",
    }));

    const { getByLabelText, getByTitle } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });
    await fireEvent.click(
      getByLabelText("Show all dependencies (not only forced updates)") as HTMLInputElement,
    );
    await tick();
    await fireEvent.click(getByTitle("Toggle favorite"));
    expect(state).toBeTruthy();
    let favorites = new Set<string>();
    state.subscribe((value) => {
      favorites = value.favorites;
    })();
    expect(favorites.has("com.example:plain")).toBe(true);
  });

  it("safely ignores jump requests when no target node or DOM element exists", async () => {
    const mergedRoot = computeDiff(
      parseGradleTree("+--- com.example:one:1.0.0"),
      parseGradleTree("+--- com.example:one:1.0.0"),
    ).mergedRoot;
    const mergedChildren = mergedRoot.children as unknown as DependencyNode[];
    const forcedEntry: ForcedUpdateInfo = {
      resolved: "1.0.0",
      declared: new Set(["1.0.0"]),
      nodes: mergedChildren,
      paths: new Set(["missing-path"]),
    };

    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: mergedRoot as unknown as DependencyNode,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA: new Map([["com.example:one", mergedChildren]]),
      gaToPaths: new Map([["com.example:one", new Set(["missing-path"])]]),
      forcedUpdates: new Map([["com.example:one", forcedEntry]]),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    const { container } = render(UpdatesPage, { target: document.getElementById("app")! });
    container.querySelector("summary")?.dispatchEvent(new MouseEvent("click"));
    const scrollSpy = vi.spyOn(HTMLElement.prototype, "scrollIntoView");
    const button = container.querySelector("details button") as HTMLButtonElement;
    await fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("does nothing when jumpToPath is triggered without a merged root", async () => {
    const newRoot = parseGradleTree("+--- com.example:one:1.0.0");
    const forcedEntry: ForcedUpdateInfo = {
      resolved: "2.0.0",
      declared: new Set(["1.0.0"]),
      nodes: newRoot.children as DependencyNode[],
      paths: new Set(["com.example:one:1.0.0"]),
    };

    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot,
      mergedRoot: null,
      diffAvailable: false,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA: new Map([["com.example:one", newRoot.children as DependencyNode[]]]),
      gaToPaths: new Map([["com.example:one", new Set(["com.example:one:1.0.0"])]]),
      forcedUpdates: new Map([["com.example:one", forcedEntry]]),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success-with-warnings",
      analysisIssues: [],
    }));

    const initialHash = location.hash;
    const { container } = render(UpdatesPage, { target: document.getElementById("app")! });
    container.querySelectorAll("summary").forEach((s) => (s as HTMLElement).click());

    const jumpBtn = container.querySelector(
      "details button.button.is-small.is-light",
    ) as HTMLButtonElement | null;
    expect(jumpBtn).toBeTruthy();
    jumpBtn!.click();
    expect(location.hash).toBe(initialHash);
  });

  it("toggles favorites and jumps when node is found", async () => {
    vi.useFakeTimers();
    const mergedRoot = computeDiff(
      parseGradleTree("+--- com.example:one:1.0.0"),
      parseGradleTree("+--- com.example:two:2.0.0"),
    ).mergedRoot;
    const mergedChildren = mergedRoot.children as unknown as DependencyNode[];
    const forcedEntry: ForcedUpdateInfo = {
      resolved: "2.0.0",
      declared: new Set(["1.0.0"]),
      nodes: mergedChildren,
      paths: new Set(["com.example:one:1.0.0"]),
    };

    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: mergedRoot as unknown as DependencyNode,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set<string>(["com.example:one"]),
      searchQuery: "",
      nodeIndexByGA: new Map([["com.example:one", mergedChildren]]),
      gaToPaths: new Map([["com.example:one", new Set(["com.example:one:1.0.0"])]]),
      forcedUpdates: new Map([["com.example:one", forcedEntry]]),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    const targetId = domIdForNode({ id: mergedChildren[0].id });
    const el = document.createElement("div");
    el.id = targetId;
    document.body.appendChild(el);

    const { container } = render(UpdatesPage, { target: document.getElementById("app")! });
    container.querySelectorAll("summary").forEach((s) => (s as HTMLElement).click());
    const favBtn = container.querySelector(".button.fav") as HTMLButtonElement;
    expect(favBtn).toBeTruthy();

    const jumpBtn = container.querySelector(
      "details button.button.is-small.is-light",
    ) as HTMLButtonElement | null;
    expect(jumpBtn).toBeTruthy();
    jumpBtn!.click();
    vi.runAllTimers();

    expect(document.location.hash).toBe("#diff");
    vi.useRealTimers();
  });

  it("renders non-forced entries in show-all mode with empty path lists", async () => {
    updatesShowAll.set(true);
    const root = parseGradleTree("+--- com.example:plain:1.0.0");
    const plainNodes = root.children as DependencyNode[];

    state.update(() => ({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: root,
      mergedRoot: root as unknown as DiffNode,
      diffAvailable: false,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA: new Map([["com.example:plain", plainNodes]]),
      gaToPaths: new Map(),
      forcedUpdates: new Map(),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: "success",
      analysisIssues: [],
    }));

    const { container, getByText, getByTitle, getAllByText } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });

    expect(getByText("com.example:plain")).toBeTruthy();
    expect(getAllByText("1.0.0").length).toBe(2);
    expect(container.querySelector("article.message.is-light")).toBeTruthy();
    expect(container.querySelector(".button.fav")).toBeFalsy();

    await fireEvent.click(getByTitle("Toggle favorite"));
    expect(container.querySelector(".button.fav")).toBeTruthy();

    container.querySelector("summary")?.dispatchEvent(new MouseEvent("click"));
    expect(container.querySelector("details li")?.textContent).toContain(
      "No dependency paths recorded.",
    );
    const hiddenButton = container.querySelector(
      "details button.button.is-small.is-light",
    ) as HTMLButtonElement | null;
    expect(hiddenButton?.hidden).toBe(true);
    expect(hiddenButton?.disabled).toBe(true);
  });
});
