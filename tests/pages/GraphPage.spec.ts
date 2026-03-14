import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import { state } from "../../src/lib/stores";
import { domIdForNode } from "../../src/lib/utils";

const buildGraphModelSpy = vi.fn();
const fitSpy = vi.fn();
const resetSpy = vi.fn();
const nodeClickSpy = vi.fn();

vi.mock("../../src/lib/graph/buildGraphModel", () => ({
  createMemoizedGraphModelBuilder: () =>
    buildGraphModelSpy.mockImplementation(() => ({
      nodes: [],
      links: [],
      hasData: true,
      root: { id: "node-1" },
    })),
}));

vi.mock("../../src/lib/graph/renderGraph", () => ({
  renderGraph: vi.fn((opts) => {
    opts.onNodeClick("node-1");
    opts.onNodeClick("missing");
    return { fit: fitSpy, resetZoom: resetSpy };
  }),
}));

describe("GraphPage", () => {
  beforeEach(() => {
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
      activeTreeIndex: null,
    }));
    fitSpy.mockClear();
    resetSpy.mockClear();
    nodeClickSpy.mockClear();
    buildGraphModelSpy.mockClear();
  });

  it("renders controls, calls renderer helpers, and handles node click", async () => {
    vi.useFakeTimers();
    const targetId = domIdForNode({ id: "node-1" });
    const targetEl = document.createElement("div");
    targetEl.id = targetId;
    document.body.appendChild(targetEl);

    const GraphPage = (await import("../../src/pages/GraphPage.svelte")).default;
    const { getByText } = render(GraphPage, { target: document.getElementById("app")! });

    expect(getByText("Filters:")).toBeTruthy();
    await fireEvent.click(getByText("Fit"));
    await fireEvent.click(getByText("Reset Zoom"));
    vi.runAllTimers();

    expect(fitSpy).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(document.location.hash).toBe("#diff");
    vi.useRealTimers();
  });

  it("enables hide-non-matches when search becomes active", async () => {
    const GraphPage = (await import("../../src/pages/GraphPage.svelte")).default;
    const { getByLabelText, getByText } = render(GraphPage, { target: document.getElementById("app")! });

    expect(getByText("Filters:")).toBeTruthy();
    const toggle = getByLabelText("Hide non-matches (Graph)") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(buildGraphModelSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchQuery: "", hideNonMatches: false }),
    );

    state.setSearchQuery("koin");
    await tick();

    expect(toggle.checked).toBe(true);
    expect(buildGraphModelSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchQuery: "koin", hideNonMatches: true }),
    );
  });
});
