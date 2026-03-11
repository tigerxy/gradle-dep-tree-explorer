import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
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

  it("renders error issues with labels, line numbers, and raw snippets", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "error",
      analysisIssues: [
        {
          code: "empty-current-tree",
          severity: "error",
          source: "validation",
          message: "Current tree missing",
          line: 3,
          raw: "plain text only",
        },
      ],
    }));

    const { container, getByText } = render(AnalysisIssues, {
      target: document.getElementById("app")!,
    });

    expect(container.querySelector(".message.is-danger")).toBeTruthy();
    expect(getByText("Analysis blocked")).toBeTruthy();
    expect(getByText(/Validation/)).toBeTruthy();
    expect(getByText(/\(line 3\)/)).toBeTruthy();
    expect(getByText("plain text only")).toBeTruthy();
  });

  it("renders warning issues for old and new trees", () => {
    state.update((s) => ({
      ...s,
      analysisStatus: "success-with-warnings",
      analysisIssues: [
        {
          code: "unrecognized-line",
          severity: "warning",
          source: "old",
          message: "Old warning",
          raw: "",
        },
        {
          code: "unsupported-format",
          severity: "warning",
          source: "new",
          message: "New warning",
          raw: "",
        },
      ],
    }));

    const { container, getByText } = render(AnalysisIssues, {
      target: document.getElementById("app")!,
    });

    expect(container.querySelector(".message.is-warning")).toBeTruthy();
    expect(getByText("Analysis warnings")).toBeTruthy();
    expect(getByText(/Old tree/)).toBeTruthy();
    expect(getByText(/Current tree/)).toBeTruthy();
  });
});
