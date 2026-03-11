import { computeDiff, createUnchangedDiff } from "./diff";
import { computeForcedUpdates } from "./forcedUpdates";
import { indexNodes } from "./indexing";
import { parseGradleTree } from "../parser/gradleTreeParser";
import type { DependencyNode, DiffNode, ForcedUpdateInfo } from "../types";

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
}

export function buildAnalysis(input: BuildAnalysisInput): AnalysisResult {
  const oldText = input.oldText?.trim() || "";
  const newText = input.newText.trim();

  const oldRoot = oldText ? parseGradleTree(oldText) : null;
  const newRoot = parseGradleTree(newText);
  const diffAvailable = !!oldRoot;
  const mergedRoot = diffAvailable
    ? computeDiff(oldRoot, newRoot).mergedRoot
    : createUnchangedDiff(newRoot).mergedRoot;
  const { nodeIndexByGA } = indexNodes(newRoot);
  const { forcedUpdates, gaToPaths } = computeForcedUpdates(newRoot);

  return {
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable,
    nodeIndexByGA,
    gaToPaths,
    forcedUpdates,
  };
}
