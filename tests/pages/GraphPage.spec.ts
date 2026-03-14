import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import { state, sharedDiffFilters } from "../../src/lib/stores";
import { domIdForNode } from "../../src/lib/utils";

const buildGraphModelSpy = vi.fn();
const fitSpy = vi.fn();
const resetSpy = vi.fn();
const nodeClickSpy = vi.fn();
const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");

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
    createObjectURLSpy.mockReset();
    revokeObjectURLSpy.mockReset();
    sharedDiffFilters.reset();
  });

  it("renders controls, calls renderer helpers, and handles node click", async () => {
    vi.useFakeTimers();
    const targetId = domIdForNode({ id: "node-1" });
    const targetEl = document.createElement("div");
    targetEl.id = targetId;
    document.body.appendChild(targetEl);

    const GraphPage = (await import("../../src/pages/GraphPage.svelte")).default;
    const { getByText, getByLabelText, queryByLabelText } = render(GraphPage, {
      target: document.getElementById("app")!,
    });

    expect(getByText("Filters:")).toBeTruthy();
    expect(getByLabelText("Added")).toBeTruthy();
    expect(getByLabelText("Removed")).toBeTruthy();
    expect(getByLabelText("Changed")).toBeTruthy();
    expect(getByLabelText("Unchanged")).toBeTruthy();
    expect(getByLabelText("Favorites")).toBeTruthy();
    expect(queryByLabelText("Hide non-matches (Graph)")).toBeFalsy();
    await fireEvent.click(getByText("Fit"));
    await fireEvent.click(getByText("Reset Zoom"));
    createObjectURLSpy.mockReturnValue("blob:mock");
    await fireEvent.click(getByText("Download SVG"));
    vi.runAllTimers();

    expect(fitSpy).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock");
    expect(document.location.hash).toBe("#diff");
    vi.useRealTimers();
  });

  it("syncs shared filter selection into the graph model", async () => {
    const GraphPage = (await import("../../src/pages/GraphPage.svelte")).default;
    const { getByLabelText, getByText } = render(GraphPage, {
      target: document.getElementById("app")!,
    });

    expect(getByText("Filters:")).toBeTruthy();
    const changed = getByLabelText("Changed") as HTMLInputElement;
    expect(changed.checked).toBe(false);
    expect(buildGraphModelSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ changed: false, favorites: false }),
      }),
    );

    sharedDiffFilters.setFilter("changed", true);
    await tick();

    expect(changed.checked).toBe(true);
    expect(buildGraphModelSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ changed: true }),
      }),
    );
  });
});
