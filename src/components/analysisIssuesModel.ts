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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createAnalysisIssuesModel(
  status: AnalysisStatus | null,
  issues: AnalysisIssue[],
): AnalysisIssuesModel | null {
  if (status !== "error" && status !== "success-with-warnings") {
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

export function buildAnalysisIssuesHtml(items: AnalysisIssueViewItem[]): string {
  return items
    .map((item) => {
      const rawBlock = item.rawText
        ? `<pre class="analysis-issue-raw is-mono">${escapeHtml(item.rawText)}</pre>`
        : "";

      return `<li><strong>${escapeHtml(item.label)}</strong>: ${escapeHtml(item.message)}${escapeHtml(item.lineText)}${rawBlock}</li>`;
    })
    .join("");
}
