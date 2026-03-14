import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { state } from "../../src/lib/stores";

const fitSpy = vi.fn();
const resetSpy = vi.fn();

vi.mock("../../src/lib/graph/buildGraphModel", () => ({
  createMemoizedGraphModelBuilder: () =>
    vi.fn().mockImplementation(() => ({
      nodes: [],
      links: [],
    })),
}));

vi.mock("../../src/lib/graph/renderGraph", () => ({
  renderGraph: vi.fn(() => ({ fit: fitSpy, resetZoom: resetSpy })),
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
  });

  it("renders controls and calls renderer helpers", async () => {
    const GraphPage = (await import("../../src/pages/GraphPage.svelte")).default;
    const { getByText } = render(GraphPage, { target: document.getElementById("app")! });

    await fireEvent.click(getByText("Fit"));
    await fireEvent.click(getByText("Reset zoom"));

    expect(fitSpy).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
