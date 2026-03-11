import { beforeEach, describe, it, expect, vi } from "vitest";
import GraphPage from "../../src/pages/GraphPage.svelte";
import { fireEvent, render } from "@testing-library/svelte";
import { state, graphHideNonMatches } from "../../src/lib/stores";
import { parseGradleTree, computeDiff, buildParentIdsById } from "../../src/lib/logic";
import fs from "node:fs";
import path from "node:path";
import { tick } from "svelte";

function read(file: string) {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

async function setupPage() {
  const oldRoot = parseGradleTree(read("gradle-old.txt"));
  const newRoot = parseGradleTree(read("gradle-new.txt"));
  const { mergedRoot } = computeDiff(oldRoot, newRoot);
  state.update(() => ({
    oldText: "",
    newText: "",
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable: true,
    favorites: new Set<string>(),
    searchQuery: "",
    nodeIndexByGA: new Map(),
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
    parentIdsById: buildParentIdsById(mergedRoot),
    oldParseDiagnostics: [],
    newParseDiagnostics: [],
    analysisStatus: "success",
    analysisIssues: [],
  }));

  return render(GraphPage, { target: document.getElementById("app")! });
}

describe("GraphPage", () => {
  beforeEach(() => {
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 200, height: 100 }),
    });
  });

  it("renders an SVG graph for merged tree", async () => {
    const { container } = await setupPage();
    const svg = container.querySelector("svg#graphSvg");
    expect(svg).toBeTruthy();
  });

  it("colors nodes by status from merged diff", async () => {
    const { container } = await setupPage();
    // Nudge reactive render
    await tick();
    state.update((s) => ({ ...s }));
    await tick();
    const circles = Array.from(container.querySelectorAll("circle")) as SVGCircleElement[];
    const fills = circles.map((c) => c.getAttribute("fill"));
    expect(fills).toContain("#48c774"); // added (Bulma success)
    expect(fills).toContain("#f14668"); // removed (Bulma danger)
    expect(fills).toContain("#ffe08a"); // changed (Bulma warning light)
  });

  it("uses currentColor for text fill and respects dark theme", async () => {
    const { container } = await setupPage();
    await tick();
    state.update((s) => ({ ...s }));
    await tick();
    const t1 = container.querySelector("text");
    expect(t1?.getAttribute("fill")).toBe("currentColor");

    // Toggle dark theme and re-trigger render
    document.body.classList.add("dark");
    graphHideNonMatches.set(true);
    await tick();
    const t2 = container.querySelector("text");
    expect(t2?.getAttribute("fill")).toBe("currentColor");
  });

  it("hide non-matches reduces rendered nodes for a search term", async () => {
    const { container } = await setupPage();
    await tick();
    state.update((s) => ({ ...s }));
    await tick();
    const before = container.querySelectorAll("text").length;

    // Apply search and hide non-matches
    state.setSearchQuery("koin");
    graphHideNonMatches.set(true);
    await tick();
    const after = container.querySelectorAll("text").length;
    expect(after).toBeLessThan(before);
  });

  it("shows the empty graph message when no tree is available", async () => {
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

    const { container } = render(GraphPage, { target: document.getElementById("app")! });
    state.update((s) => ({ ...s }));
    await tick();
    expect(container.querySelector("svg text")?.textContent).toContain(
      "Parse a current dependency tree on the Input page to see the graph.",
    );
  });

  it("jumps to the diff tree when a graph node is clicked and reset zoom is wired", async () => {
    const { container, getByText } = await setupPage();
    await tick();
    state.update((s) => ({ ...s }));
    await tick();
    const target = document.createElement("div");
    target.id = "node-root";
    const scrollIntoView = vi.fn();
    Object.defineProperty(target, "scrollIntoView", { value: scrollIntoView, configurable: true });
    document.body.appendChild(target);

    const clickableCircle = container.querySelector("circle") as SVGCircleElement | null;
    expect(clickableCircle).toBeTruthy();
    await fireEvent.click(clickableCircle as SVGCircleElement);
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(location.hash).toBe("#diff");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    await fireEvent.click(getByText("Reset zoom"));
    target.remove();
  });
});
