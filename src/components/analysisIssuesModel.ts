import type { AnalysisIssue, AnalysisStatus } from "../lib/types";
import { analysisMessageClass, issueLabel } from "./analysisIssuesView";

export interface AnalysisIssueViewItem {
  key: string;
  label: string;
  message: string;
  lineText: string;
  rawText: string;
}

export interface AnalysisIssuesModel {
  title: string;
  messageClass: string;
  items: AnalysisIssueViewItem[];
}

export function createAnalysisIssuesModel(
  status: AnalysisStatus | null,
  issues: AnalysisIssue[],
): AnalysisIssuesModel | null {
  if (status !== "error" && status !== "success-with-warnings") {
    return null;
  }

  if (issues.length === 0) {
    return null;
  }

  return {
    title: status === "error" ? "Analysis blocked" : "Analysis warnings",
    messageClass: analysisMessageClass(status),
    items: issues.map((issue, index) => ({
      key: `${issue.source}-${issue.code}-${issue.line ?? 0}-${index}`,
      label: issueLabel(issue.source),
      message: issue.message,
      lineText: issue.line ? ` (line ${issue.line})` : "",
      rawText: issue.raw ?? "",
    })),
  };
}
