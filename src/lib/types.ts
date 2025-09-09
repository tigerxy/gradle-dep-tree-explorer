export type Status = "added" | "removed" | "changed" | "unchanged";

export interface DepNode {
  id: string;
  name: string;
  declaredVersion: string;
  resolvedVersion: string;
  children: DepNode[];
  parent?: DepNode;
  depth: number;
  status?: Status;
  descendantCount?: number;
  collapsed?: boolean;
  _fromOldRemoved?: boolean;
  // Optional: previous versions from old tree for diff display
  prevDeclaredVersion?: string;
  prevResolvedVersion?: string;
}

export interface ForcedUpdateInfo {
  resolved: string;
  declared: Set<string>;
  nodes: DepNode[];
  paths: Set<string>;
}

export type Route = "input" | "diff" | "updates" | "graph";
