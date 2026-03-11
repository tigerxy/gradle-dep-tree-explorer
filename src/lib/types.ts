export type Status = "added" | "removed" | "changed" | "unchanged";

export interface DependencyNode {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DependencyNode[];
  parent?: DependencyNode;
  depth: number;
  descendantCount: number;
}

export interface DiffNode {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DiffNode[];
  parent?: DiffNode;
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

export type Route = "input" | "diff" | "updates" | "graph";
