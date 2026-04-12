import { describe, expect, it } from "vitest";
import { createAnalysisIssuesModel } from "../../src/components/analysisIssuesModel";

describe("analysisIssuesModel", () => {
  it("returns null for non-rendered statuses", () => {
    expect(createAnalysisIssuesModel(null, [])).toBeNull();
    expect(createAnalysisIssuesModel("success", [])).toBeNull();
  });

  it("returns null when there are no issues to display", () => {
    expect(createAnalysisIssuesModel("error", [])).toBeNull();
    expect(createAnalysisIssuesModel("success-with-warnings", [])).toBeNull();
  });

  it("builds a blocked model with line and raw text", () => {
    expect(
      createAnalysisIssuesModel("error", [
        {
          source: "old",
          code: "missing-current-tree",
          severity: "error",
          message: "Missing tree",
          line: 7,
          raw: "raw line",
        },
      ]),
    ).toEqual({
      title: "Analysis blocked",
      messageClass: "is-danger",
      items: [
        {
          key: "old-missing-current-tree-7-0",
          label: "Old tree",
          message: "Missing tree",
          lineText: " (line 7)",
          rawText: "raw line",
        },
      ],
    });
  });

  it("builds a warning model without optional fields", () => {
    expect(
      createAnalysisIssuesModel("success-with-warnings", [
        {
          source: "validation",
          code: "empty-current-tree",
          severity: "warning",
          message: "Empty",
        },
      ]),
    ).toEqual({
      title: "Analysis warnings",
      messageClass: "is-warning",
      items: [
        {
          key: "validation-empty-current-tree-0-0",
          label: "Validation",
          message: "Empty",
          lineText: "",
          rawText: "",
        },
      ],
    });
  });
});
