import type { AnalysisResult } from "./buildAnalysis";
import { flattenTreePreorder, type FlattenedTree } from "../tree/flatten";
import type {
  AnalysisIssue,
  AnalysisStatus,
  DependencyNode,
  DiffNode,
  ForcedUpdateInfo,
  ParseDiagnostic,
  Status,
} from "../types";

export interface DependencyNodeDto {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DependencyNodeDto[];
  depth: number;
  descendantCount: number;
}

export interface DiffNodeDto extends DependencyNodeDto {
  status: Status;
  prevDeclaredVersion?: string;
  prevResolvedVersion?: string;
  children: DiffNodeDto[];
}

export interface FlattenedTreeDto {
  ids: string[];
  parentIndexByIndex: number[];
  depthByIndex: number[];
  startByIndex: number[];
  endByIndex: number[];
}

export interface ForcedUpdateDto {
  ga: string;
  resolved: string;
  declared: string[];
  nodeIds: string[];
  paths: string[];
}

export interface AnalysisResultDto {
  status: AnalysisStatus;
  issues: AnalysisIssue[];
  oldRoot: DependencyNodeDto | null;
  newRoot: DependencyNodeDto | null;
  mergedRoot: DiffNodeDto | null;
  diffAvailable: boolean;
  nodeIndexByGA: Array<[string, string[]]>;
  activeTreeIndex: FlattenedTreeDto | null;
  gaToPaths: Array<[string, string[]]>;
  forcedUpdates: ForcedUpdateDto[];
  parentIdsById: Array<[string, string]>;
  oldParseDiagnostics: ParseDiagnostic[];
  newParseDiagnostics: ParseDiagnostic[];
}

function serializeDependencyNode(node: DependencyNode | null): DependencyNodeDto | null {
  if (!node) return null;

  return {
    id: node.id,
    name: node.name,
    declaredVersion: node.declaredVersion,
    resolvedVersion: node.resolvedVersion,
    children: node.children.map(serializeDependencyNode).filter(Boolean) as DependencyNodeDto[],
    depth: node.depth,
    descendantCount: node.descendantCount,
  };
}

function serializeDiffNode(node: DiffNode | null): DiffNodeDto | null {
  if (!node) return null;

  return {
    id: node.id,
    name: node.name,
    declaredVersion: node.declaredVersion,
    resolvedVersion: node.resolvedVersion,
    prevDeclaredVersion: node.prevDeclaredVersion,
    prevResolvedVersion: node.prevResolvedVersion,
    status: node.status,
    children: node.children.map(serializeDiffNode).filter(Boolean) as DiffNodeDto[],
    depth: node.depth,
    descendantCount: node.descendantCount,
  };
}

function deserializeDependencyNode(node: DependencyNodeDto | null): DependencyNode | null {
  if (!node) return null;

  return {
    id: node.id,
    name: node.name,
    declaredVersion: node.declaredVersion,
    resolvedVersion: node.resolvedVersion,
    children: node.children.map(deserializeDependencyNode).filter(Boolean) as DependencyNode[],
    depth: node.depth,
    descendantCount: node.descendantCount,
  };
}

function deserializeDiffNode(node: DiffNodeDto | null): DiffNode | null {
  if (!node) return null;

  return {
    id: node.id,
    name: node.name,
    declaredVersion: node.declaredVersion,
    resolvedVersion: node.resolvedVersion,
    prevDeclaredVersion: node.prevDeclaredVersion,
    prevResolvedVersion: node.prevResolvedVersion,
    status: node.status,
    children: node.children.map(deserializeDiffNode).filter(Boolean) as DiffNode[],
    depth: node.depth,
    descendantCount: node.descendantCount,
  };
}

function serializeFlattenedTree(
  flattened: FlattenedTree<DiffNode> | null,
): FlattenedTreeDto | null {
  if (!flattened) return null;

  return {
    ids: [...flattened.ids],
    parentIndexByIndex: [...flattened.parentIndexByIndex],
    depthByIndex: [...flattened.depthByIndex],
    startByIndex: [...flattened.startByIndex],
    endByIndex: [...flattened.endByIndex],
  };
}

function deserializeFlattenedTree(
  flattened: FlattenedTreeDto | null,
  root: DiffNode | null,
): FlattenedTree<DiffNode> | null {
  if (!flattened || !root) return null;

  const base = flattenTreePreorder(root);
  return {
    nodes: base.nodes,
    ids: [...flattened.ids],
    parentIndexByIndex: [...flattened.parentIndexByIndex],
    depthByIndex: [...flattened.depthByIndex],
    startByIndex: [...flattened.startByIndex],
    endByIndex: [...flattened.endByIndex],
    indexById: new Map(base.indexById),
  };
}

function indexNodesById(root: DependencyNode | null): Map<string, DependencyNode> {
  const byId = new Map<string, DependencyNode>();
  if (!root) return byId;

  const stack: DependencyNode[] = [root];
  while (stack.length) {
    const node = stack.pop() as DependencyNode;
    byId.set(node.id, node);
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]);
    }
  }

  return byId;
}

export function serializeAnalysisResult(result: AnalysisResult): AnalysisResultDto {
  return {
    status: result.status,
    issues: result.issues,
    oldRoot: serializeDependencyNode(result.oldRoot),
    newRoot: serializeDependencyNode(result.newRoot),
    mergedRoot: serializeDiffNode(result.mergedRoot),
    diffAvailable: result.diffAvailable,
    nodeIndexByGA: Array.from(result.nodeIndexByGA.entries()).map(([ga, nodes]) => [
      ga,
      nodes.map((node) => node.id),
    ]),
    activeTreeIndex: serializeFlattenedTree(result.activeTreeIndex),
    gaToPaths: Array.from(result.gaToPaths.entries()).map(([ga, paths]) => [ga, Array.from(paths)]),
    forcedUpdates: Array.from(result.forcedUpdates.entries()).map(([ga, info]) => ({
      ga,
      resolved: info.resolved,
      declared: Array.from(info.declared),
      nodeIds: info.nodes.map((node) => node.id),
      paths: Array.from(info.paths),
    })),
    parentIdsById: Array.from(result.parentIdsById.entries()),
    oldParseDiagnostics: result.oldParseDiagnostics,
    newParseDiagnostics: result.newParseDiagnostics,
  };
}

export function deserializeAnalysisResult(dto: AnalysisResultDto): AnalysisResult {
  const oldRoot = deserializeDependencyNode(dto.oldRoot);
  const newRoot = deserializeDependencyNode(dto.newRoot);
  const mergedRoot = deserializeDiffNode(dto.mergedRoot);
  const nodesById = indexNodesById(newRoot);
  const nodeIndexByGA = new Map<string, DependencyNode[]>(
    dto.nodeIndexByGA.map(([ga, nodeIds]) => [
      ga,
      nodeIds.map((id) => nodesById.get(id)).filter(Boolean) as DependencyNode[],
    ]),
  );
  const gaToPaths = new Map<string, Set<string>>(
    dto.gaToPaths.map(([ga, paths]) => [ga, new Set(paths)]),
  );
  const forcedUpdates = new Map<string, ForcedUpdateInfo>(
    dto.forcedUpdates.map((info) => [
      info.ga,
      {
        resolved: info.resolved,
        declared: new Set(info.declared),
        nodes: info.nodeIds.map((id) => nodesById.get(id)).filter(Boolean) as DependencyNode[],
        paths: new Set(info.paths),
      },
    ]),
  );

  return {
    status: dto.status,
    issues: dto.issues,
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable: dto.diffAvailable,
    nodeIndexByGA,
    activeTreeIndex: deserializeFlattenedTree(dto.activeTreeIndex, mergedRoot),
    gaToPaths,
    forcedUpdates,
    parentIdsById: new Map(dto.parentIdsById),
    oldParseDiagnostics: dto.oldParseDiagnostics,
    newParseDiagnostics: dto.newParseDiagnostics,
  };
}
