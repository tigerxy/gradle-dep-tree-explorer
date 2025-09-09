import { describe, it, expect } from "vitest";
import GraphPage from "../../src/pages/GraphPage.svelte";
import { render } from "@testing-library/svelte";
import { state, graphHideNonMatches } from "../../src/lib/stores";
import { parseGradleTree, computeDiff } from "../../src/lib/logic";
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
  state.set({
    oldText: "",
    newText: "",
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable: true,
    favorites: new Set(),
    searchQuery: "",
    nodeIndexByGA: new Map(),
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
  } as any);

  return render(GraphPage, { target: document.getElementById("app")! });
}

describe("GraphPage", () => {
  it("renders an SVG graph for merged tree", async () => {
    const { container } = await setupPage();
    const svg = container.querySelector("svg#graphSvg");
    expect(svg).toBeTruthy();
  });

  it("colors nodes by status from merged diff", async () => {
    const { container } = await setupPage();
    // Nudge reactive render
    await tick();
    state.update((s: any) => ({ ...s }));
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
    state.update((s: any) => ({ ...s }));
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
    state.update((s: any) => ({ ...s }));
    await tick();
    const before = container.querySelectorAll("text").length;

    // Apply search and hide non-matches
    state.set({ ...(state as any)._value, searchQuery: "koin" });
    graphHideNonMatches.set(true);
    await tick();
    const after = container.querySelectorAll("text").length;
    expect(after).toBeLessThan(before);
  });
});
