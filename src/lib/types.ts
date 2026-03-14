export type Status = "added" | "removed" | "changed" | "unchanged";

export interface DependencyNode {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DependencyNode[];
  depth: number;
  descendantCount: number;
}

export interface DiffNode {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DiffNode[];
  depth: number;
  descendantCount: number;
  status: Status;
  prevDeclaredVersion?: string;
  prevResolvedVersion?: string;
}

export interface ForcedUpdateInfo {
  resolved: string;
  declared: Set<string>;
  nodes: DependencyNode[];
  paths: Set<string>;
}

export type ParseDiagnosticCode =
  | "ambiguous-structure"
  | "unrecognized-line"
  | "unsupported-format";

export type ParseDiagnosticSeverity = "warning";

export interface ParseDiagnostic {
  code: ParseDiagnosticCode;
  severity: ParseDiagnosticSeverity;
  message: string;
  line: number;
  raw: string;
  depth?: number;
}

export type ParsedDependencyLineKind = "module" | "project" | "unknown";

export interface ParsedDependencyLine {
  line: number;
  depth: number;
  kind: ParsedDependencyLineKind;
  group?: string;
  artifact?: string;
  declaredVersion?: string;
  resolvedVersion?: string;
  raw: string;
}

export interface ParseGradleTreeResult {
  root: DependencyNode;
  lines: ParsedDependencyLine[];
  diagnostics: ParseDiagnostic[];
}

export type AnalysisIssueSource = "old" | "new" | "validation";

export type AnalysisIssueCode =
  | ParseDiagnosticCode
  | "missing-current-tree"
  | "empty-current-tree"
  | "empty-old-tree";

export type AnalysisIssueSeverity = "error" | ParseDiagnosticSeverity;

export interface AnalysisIssue {
  code: AnalysisIssueCode;
  severity: AnalysisIssueSeverity;
  source: AnalysisIssueSource;
  message: string;
  line?: number;
  raw?: string;
  depth?: number;
}

export type AnalysisStatus = "success" | "success-with-warnings" | "error";

export type Route = "input" | "diff" | "updates" | "graph";

// Runtime marker to include this module in coverage.
export const typesModuleLoaded = true;
