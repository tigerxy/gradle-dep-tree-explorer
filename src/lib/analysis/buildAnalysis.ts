import { computeDiff, createUnchangedDiff } from "./diff";
import { computeForcedUpdates } from "./forcedUpdates";
import { indexNodes } from "./indexing";
import { parseGradleTreeWithDiagnostics } from "../parser/gradleTreeParser";
import { buildParentIdsById } from "../tree/parents";
import type { DependencyNode, DiffNode, ForcedUpdateInfo, ParseDiagnostic } from "../types";

export interface BuildAnalysisInput {
  oldText?: string;
  newText: string;
}

export interface AnalysisResult {
  oldRoot: DependencyNode | null;
  newRoot: DependencyNode;
  mergedRoot: DiffNode;
  diffAvailable: boolean;
  nodeIndexByGA: Map<string, DependencyNode[]>;
  gaToPaths: Map<string, Set<string>>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  parentIdsById: Map<string, string>;
  oldParseDiagnostics: ParseDiagnostic[];
  newParseDiagnostics: ParseDiagnostic[];
}

export function buildAnalysis(input: BuildAnalysisInput): AnalysisResult {
  const oldText = input.oldText?.trim() || "";
  const newText = input.newText.trim();

  const oldParseResult = oldText ? parseGradleTreeWithDiagnostics(oldText) : null;
  const newParseResult = parseGradleTreeWithDiagnostics(newText);
  const oldRoot = oldParseResult?.root || null;
  const newRoot = newParseResult.root;
  const diffAvailable = !!oldRoot;
  const mergedRoot = diffAvailable
    ? computeDiff(oldRoot, newRoot).mergedRoot
    : createUnchangedDiff(newRoot).mergedRoot;
  const { nodeIndexByGA } = indexNodes(newRoot);
  const { forcedUpdates, gaToPaths } = computeForcedUpdates(newRoot);
  const parentIdsById = buildParentIdsById(mergedRoot);

  return {
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable,
    nodeIndexByGA,
    gaToPaths,
    forcedUpdates,
    parentIdsById,
    oldParseDiagnostics: oldParseResult?.diagnostics || [],
    newParseDiagnostics: newParseResult.diagnostics,
  };
}
