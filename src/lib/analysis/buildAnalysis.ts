import { computeDiff, createUnchangedDiff } from "./diff";
import { computeForcedUpdates } from "./forcedUpdates";
import { indexNodes } from "./indexing";
import { parseGradleTreeWithDiagnostics } from "../parser/gradleTreeParser";
import { flattenTreePreorder, type FlattenedTree } from "../tree/flatten";
import { buildParentIdsByIdFromFlattened } from "../tree/parents";
import type {
  AnalysisIssue,
  AnalysisStatus,
  DependencyNode,
  DiffNode,
  ForcedUpdateInfo,
  ParseDiagnostic,
  ParseGradleTreeResult,
} from "../types";

export interface BuildAnalysisInput {
  oldText?: string;
  newText: string;
}

export interface AnalysisResult {
  status: AnalysisStatus;
  issues: AnalysisIssue[];
  oldRoot: DependencyNode | null;
  newRoot: DependencyNode | null;
  mergedRoot: DiffNode | null;
  diffAvailable: boolean;
  nodeIndexByGA: Map<string, DependencyNode[]>;
  activeTreeIndex: FlattenedTree<DiffNode> | null;
  gaToPaths: Map<string, Set<string>>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  parentIdsById: Map<string, string>;
  oldParseDiagnostics: ParseDiagnostic[];
  newParseDiagnostics: ParseDiagnostic[];
}

export function buildAnalysis(input: BuildAnalysisInput): AnalysisResult {
  const oldText = input.oldText?.trim() || "";
  const newText = input.newText.trim();
  const emptyDerivedState = createEmptyDerivedState();

  if (!newText) {
    return {
      status: "error",
      issues: [
        {
          code: "missing-current-tree",
          severity: "error",
          source: "validation",
          message: "Provide a current dependency tree before building the views.",
        },
      ],
      oldRoot: null,
      newRoot: null,
      mergedRoot: null,
      diffAvailable: false,
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      ...emptyDerivedState,
    };
  }

  const oldParseResult = oldText ? parseGradleTreeWithDiagnostics(oldText) : null;
  const newParseResult = parseGradleTreeWithDiagnostics(newText);
  const issues: AnalysisIssue[] = [
    ...mapDiagnostics("new", newParseResult.diagnostics),
    ...mapDiagnostics("old", oldParseResult?.diagnostics || []),
  ];

  if (!hasRecognizedDependencies(newParseResult)) {
    issues.unshift({
      code: "empty-current-tree",
      severity: "error",
      source: "validation",
      message: "No dependencies were recognized in the current dependency tree.",
      raw: firstNonEmptyLine(newText),
    });

    return {
      status: "error",
      issues,
      oldRoot: null,
      newRoot: null,
      mergedRoot: null,
      diffAvailable: false,
      oldParseDiagnostics: oldParseResult?.diagnostics || [],
      newParseDiagnostics: newParseResult.diagnostics,
      ...emptyDerivedState,
    };
  }

  const oldRoot = resolveOldRoot(oldText, oldParseResult, issues);
  const newRoot = newParseResult.root;
  const diffAvailable = !!oldRoot;
  const mergedRoot = diffAvailable
    ? computeDiff(oldRoot, newRoot).mergedRoot
    : createUnchangedDiff(newRoot).mergedRoot;
  const { nodeIndexByGA } = indexNodes(newRoot);
  const activeTreeIndex = flattenTreePreorder(mergedRoot);
  const { forcedUpdates, gaToPaths } = computeForcedUpdates(newRoot);
  const parentIdsById = buildParentIdsByIdFromFlattened(activeTreeIndex);
  const status: AnalysisStatus = issues.length ? "success-with-warnings" : "success";

  return {
    status,
    issues,
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable,
    nodeIndexByGA,
    activeTreeIndex,
    gaToPaths,
    forcedUpdates,
    parentIdsById,
    oldParseDiagnostics: oldParseResult?.diagnostics || [],
    newParseDiagnostics: newParseResult.diagnostics,
  };
}

function createEmptyDerivedState(): Pick<
  AnalysisResult,
  "nodeIndexByGA" | "activeTreeIndex" | "gaToPaths" | "forcedUpdates" | "parentIdsById"
> {
  return {
    nodeIndexByGA: new Map<string, DependencyNode[]>(),
    activeTreeIndex: null,
    gaToPaths: new Map<string, Set<string>>(),
    forcedUpdates: new Map<string, ForcedUpdateInfo>(),
    parentIdsById: new Map<string, string>(),
  };
}

function mapDiagnostics(source: "old" | "new", diagnostics: ParseDiagnostic[]): AnalysisIssue[] {
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    source,
  }));
}

function resolveOldRoot(
  oldText: string,
  oldParseResult: ParseGradleTreeResult | null,
  issues: AnalysisIssue[],
): DependencyNode | null {
  if (!oldText || !oldParseResult) {
    return null;
  }

  if (hasRecognizedDependencies(oldParseResult)) {
    return oldParseResult.root;
  }

  issues.unshift({
    code: "empty-old-tree",
    severity: "warning",
    source: "validation",
    message: "The old dependency tree could not be parsed, so diff mode is unavailable.",
    raw: firstNonEmptyLine(oldText),
  });
  return null;
}

function firstNonEmptyLine(text: string): string | undefined {
  return (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function hasRecognizedDependencies(result: ParseGradleTreeResult): boolean {
  return result.lines.some((line) => line.kind === "module" || line.kind === "project");
}
