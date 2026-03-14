import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "../../src/lib/analysis/buildAnalysis";

const buildAnalysisMock = vi.fn<(input: { oldText?: string; newText: string }) => AnalysisResult>();

vi.mock("../../src/lib/analysis/buildAnalysis", () => ({
  buildAnalysis: buildAnalysisMock,
}));

function makeAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    status: "success",
    issues: [],
    oldRoot: null,
    newRoot: null,
    mergedRoot: null,
    diffAvailable: false,
    nodeIndexByGA: new Map(),
    activeTreeIndex: null,
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
    parentIdsById: new Map(),
    oldParseDiagnostics: [],
    newParseDiagnostics: [],
    ...overrides,
  };
}

function getStoreValue<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  let current!: T;
  const unsubscribe = store.subscribe((value) => {
    current = value;
  });
  unsubscribe();
  return current;
}

describe("stores", () => {
  beforeEach(() => {
    vi.resetModules();
    buildAnalysisMock.mockReset();
    localStorage.clear();
  });

  it("initializes favorites from localStorage and trims search queries", async () => {
    localStorage.setItem("depFavorites", JSON.stringify(["org.example:alpha"]));
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());

    const { state } = await import("../../src/lib/stores");
    state.setSearchQuery("  alpha  ");

    expect(getStoreValue(state).favorites).toEqual(new Set(["org.example:alpha"]));
    expect(getStoreValue(state).searchQuery).toBe("alpha");
  });

  it("toggles favorites, updates stored texts, and persists the new favorites set", async () => {
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());
    const { state } = await import("../../src/lib/stores");

    state.setTexts({ newText: "new tree" });
    state.setTexts({ oldText: "old tree" });
    state.toggleFavorite("org.example:alpha");
    state.toggleFavorite("org.example:alpha");

    expect(getStoreValue(state)).toMatchObject({
      oldText: "old tree",
      newText: "new tree",
    });
    expect(getStoreValue(state).favorites).toEqual(new Set());
    expect(localStorage.getItem("depFavorites")).toBe("[]");
  });

  it("runs analysis and copies derived fields into state", async () => {
    const mergedRoot = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      children: [],
      depth: 0,
      descendantCount: 0,
      status: "unchanged" as const,
    };
    buildAnalysisMock.mockReturnValue(
      makeAnalysisResult({
        mergedRoot,
        diffAvailable: true,
        nodeIndexByGA: new Map([["org.example:alpha", []]]),
        gaToPaths: new Map([["org.example:alpha", new Set(["org.example:alpha:1.0.0"])]]),
        forcedUpdates: new Map([
          [
            "org.example:alpha",
            {
              resolved: "2.0.0",
              declared: new Set(["1.0.0"]),
              nodes: [],
              paths: new Set(["org.example:alpha:2.0.0"]),
            },
          ],
        ]),
        parentIdsById: new Map([["child", "root"]]),
        oldParseDiagnostics: [
          { code: "unrecognized-line", severity: "warning", message: "x", line: 1, raw: "x" },
        ],
        newParseDiagnostics: [
          { code: "unsupported-format", severity: "warning", message: "y", line: 2, raw: "y" },
        ],
      }),
    );

    const { state } = await import("../../src/lib/stores");
    state.setTexts({ oldText: "old", newText: "new" });
    const result = state.parseAndBuild();

    expect(buildAnalysisMock).toHaveBeenCalledTimes(1);
    expect(buildAnalysisMock).toHaveBeenLastCalledWith({ oldText: "old", newText: "new" });
    expect(result.diffAvailable).toBe(true);
    expect(getStoreValue(state)).toMatchObject({
      mergedRoot,
      diffAvailable: true,
    });
    expect(getStoreValue(state).parentIdsById.get("child")).toBe("root");
  });

  it("resets shared diff filters when parse and build runs", async () => {
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());
    const { state, sharedDiffFilters } = await import("../../src/lib/stores");

    sharedDiffFilters.setFilter("changed", true);
    sharedDiffFilters.setFilter("favorites", true);

    state.setTexts({ newText: "new" });
    state.parseAndBuild();

    expect(getStoreValue(sharedDiffFilters)).toEqual({
      added: false,
      removed: false,
      changed: false,
      unchanged: false,
      favorites: false,
    });
  });

  it("manages expanded node state for reset, expand, collapse, and toggle", async () => {
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());
    const { expanded } = await import("../../src/lib/stores");
    const root = {
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [{ id: "b1", children: [] }] },
      ],
    };

    expanded.reset(root);
    expect(getStoreValue(expanded)).toEqual(new Set(["root"]));

    expanded.expandAll(root);
    expect(getStoreValue(expanded)).toEqual(new Set(["root", "a", "b", "b1"]));

    expanded.collapseAll(root);
    expect(getStoreValue(expanded)).toEqual(new Set(["root"]));

    expanded.toggle("a");
    expanded.toggle("root");
    expect(getStoreValue(expanded)).toEqual(new Set(["a"]));
  });

  it("handles expansion helpers when no root is provided", async () => {
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());
    const { expanded } = await import("../../src/lib/stores");

    expanded.reset(null);
    expect(getStoreValue(expanded)).toEqual(new Set());

    expanded.expandAll(null);
    expect(getStoreValue(expanded)).toEqual(new Set());

    expanded.collapseAll(null);
    expect(getStoreValue(expanded)).toEqual(new Set());
  });

  it("shares diff-style filter state across pages", async () => {
    buildAnalysisMock.mockReturnValue(makeAnalysisResult());
    const { sharedDiffFilters } = await import("../../src/lib/stores");

    sharedDiffFilters.setFilter("changed", true);
    sharedDiffFilters.setFilter("favorites", true);
    sharedDiffFilters.reset();

    expect(getStoreValue(sharedDiffFilters)).toEqual({
      added: false,
      removed: false,
      changed: false,
      unchanged: false,
      favorites: false,
    });
  });
});
