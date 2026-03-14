import { describe, it, expect } from "vitest";
import {
  analysisMessageClass,
  issueLabel,
} from "../../src/components/analysisIssuesView";

describe("analysisIssuesView", () => {
  it("maps issue sources to labels", () => {
    expect(issueLabel("old")).toBe("Old tree");
    expect(issueLabel("new")).toBe("Current tree");
    expect(issueLabel("validation")).toBe("Validation");
  });

  it("maps analysis statuses to message classes", () => {
    expect(analysisMessageClass("error")).toBe("is-danger");
    expect(analysisMessageClass("success-with-warnings")).toBe("is-warning");
    expect(analysisMessageClass("success")).toBe("is-info");
    expect(analysisMessageClass(null)).toBe("is-info");
  });
});
