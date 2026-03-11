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

export type Route = "input" | "diff" | "updates" | "graph";
