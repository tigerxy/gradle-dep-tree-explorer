import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import { beforeEach, describe, expect, it } from "vitest";
import AnalysisIssues from "../../src/components/AnalysisIssues.svelte";
import { state } from "../../src/lib/stores";

describe("AnalysisIssues", () => {
  beforeEach(() => {
    state.update((s) => ({
      ...s,
      analysisStatus: null,
      analysisIssues: [],
    }));
  });

  it("renders error issues with raw and line", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "error",
      analysisIssues: [
        { source: "old", code: "missing-current-tree", severity: "error", message: "msg", line: 3 },
        {
          source: "new",
          code: "unrecognized-line",
          severity: "warning",
          message: "warn",
          raw: "raw",
        },
      ],
    }));

    const { getByText } = render(AnalysisIssues, { target: document.getElementById("app")! });
    expect(getByText(/Analysis blocked/)).toBeTruthy();
    expect(getByText(/Old tree/)).toBeTruthy();
    expect(getByText(/line 3/)).toBeTruthy();
    expect(getByText("raw")).toBeTruthy();
  });

  it("renders warnings when status is success-with-warnings", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "success-with-warnings",
      analysisIssues: [
        { source: "validation", code: "empty-current-tree", severity: "warning", message: "warn" },
      ],
    }));

    const { getByText } = render(AnalysisIssues, { target: document.getElementById("app")! });
    expect(getByText(/Analysis warnings/)).toBeTruthy();
    expect(getByText(/Validation/)).toBeTruthy();
  });

  it("renders nothing when analysis status is success", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "success",
      analysisIssues: [],
    }));
    const { container } = render(AnalysisIssues, { target: document.getElementById("app")! });
    expect(container.textContent?.trim()).toBe("");
  });

  it("renders nothing when the status has no issues", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "error",
      analysisIssues: [],
    }));

    const { container } = render(AnalysisIssues, { target: document.getElementById("app")! });

    expect(container.querySelector("article.message")).toBeNull();
  });

  it("allows manual dismissal", async () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "success-with-warnings",
      analysisIssues: [
        { source: "validation", code: "empty-current-tree", severity: "warning", message: "warn" },
      ],
    }));

    const { getByRole, queryByText } = render(AnalysisIssues, {
      target: document.getElementById("app")!,
    });

    await fireEvent.click(getByRole("button", { name: "Close analysis issues" }));

    expect(queryByText(/Analysis warnings/)).toBeNull();
  });

  it("shows the panel again when a new result arrives", async () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "success-with-warnings",
      analysisIssues: [
        { source: "validation", code: "empty-current-tree", severity: "warning", message: "warn" },
      ],
    }));

    const { getByRole, queryByText, getByText } = render(AnalysisIssues, {
      target: document.getElementById("app")!,
    });

    await fireEvent.click(getByRole("button", { name: "Close analysis issues" }));
    expect(queryByText(/Analysis warnings/)).toBeNull();

    state.update((s) => ({
      ...s,
      analysisStatus: "error",
      analysisIssues: [
        { source: "old", code: "missing-current-tree", severity: "error", message: "blocked" },
      ],
    }));
    await tick();

    expect(getByText(/Analysis blocked/)).toBeTruthy();
  });
});
