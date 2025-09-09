import { pathToString } from "./utils";
import type { DepNode, ForcedUpdateInfo } from "./types";

export function computeDescendantCounts(node: DepNode): number {
  let c = 0;
  for (const ch of node.children) {
    c += 1 + computeDescendantCounts(ch);
  }
  node.descendantCount = c;
  return c;
}

export function parseGradleTree(text: string): DepNode {
  const lines = (text || "").split(/\r?\n/);
  const root = {
    id: "root",
    name: "root:root",
    declaredVersion: "",
    resolvedVersion: "",
    children: [],
    depth: 0,
    collapsed: false,
  } as DepNode;
  const stack = [root];
  const gavRe = /([A-Za-z0-9_.-]+:[A-Za-z0-9_.-]+):([^\s()]+)(?:\s*->\s*([^\s()]+))?/;
  const projRe = /project\s*:(\S+)/;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "    ");
    const idxPlus = line.indexOf("+---");
    const idxBack = line.indexOf("\\---");
    if (idxPlus === -1 && idxBack === -1) continue;
    const idx = idxPlus !== -1 ? idxPlus : idxBack;
    const depth = Math.max(0, Math.round(idx / 5));
    const rest = line.slice(idx + 4).trim();

    let gaName: string = "",
      declaredVersion: string = "",
      resolvedVersion: string = "",
      name: string = "";
    const mGav = rest.match(gavRe);
    if (mGav) {
      gaName = mGav[1];
      declaredVersion = mGav[2] || "";
      resolvedVersion = (mGav[3] || declaredVersion || "").replace(/\*\)$/, "");
      name = gaName; // GA only
    } else {
      const mProj = rest.match(projRe);
      if (mProj) {
        gaName = `project:${mProj[1]}`;
        declaredVersion = "project";
        resolvedVersion = "project";
        name = gaName;
      } else {
        const token = rest.split(/\s+/)[0];
        const parts = token.split(":");
        if (parts.length >= 2) {
          gaName = parts[0] + ":" + parts[1];
          declaredVersion = parts[2] || "";
          resolvedVersion = declaredVersion;
          name = gaName;
        } else {
          gaName = token;
          name = gaName;
        }
      }
    }

    while (stack.length > depth + 1) stack.pop();
    const parent = stack[stack.length - 1];
    const node: DepNode = {
      id: `${gaName}|${resolvedVersion}|${Math.random().toString(36).slice(2)}`,
      name,
      declaredVersion,
      resolvedVersion,
      children: [],
      parent,
      depth,
      status: "unchanged",
      descendantCount: 0,
      collapsed: true,
    };
    parent.children.push(node);
    stack.push(node);
  }
  computeDescendantCounts(root);
  return root;
}

export function indexNodes(root: DepNode): {
  nodeIndexByGA: Map<string, DepNode[]>;
  allNodes: DepNode[];
} {
  const nodeIndexByGA = new Map<string, DepNode[]>();
  const allNodes: DepNode[] = [];
  (function walk(n: DepNode) {
    allNodes.push(n);
    if (n.name && n.name !== "root:root") {
      if (!nodeIndexByGA.has(n.name)) nodeIndexByGA.set(n.name, []);
      nodeIndexByGA.get(n.name)!.push(n);
    }
    (n.children || []).forEach((c) => walk(c));
  })(root);
  return { nodeIndexByGA, allNodes };
}

export function computeForcedUpdates(root: DepNode): {
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  gaToPaths: Map<string, Set<string>>;
} {
  const forcedUpdates = new Map<string, ForcedUpdateInfo>();
  const gaToPaths = new Map<string, Set<string>>();
  (function walk(n: DepNode, path: DepNode[]) {
    const here = n.name === "root:root" ? [] : [n];
    const newPath = here.length ? [...path, n] : path;
    if (n.name && n.name !== "root:root") {
      const ga = n.name,
        declared = n.declaredVersion || "",
        resolved = n.resolvedVersion || "";
      if (declared && resolved && declared !== resolved) {
        const e: ForcedUpdateInfo = forcedUpdates.get(ga) || {
          resolved,
          declared: new Set<string>(),
          nodes: [],
          paths: new Set<string>(),
        };
        e.declared.add(declared);
        e.nodes.push(n);
        e.resolved = resolved;
        forcedUpdates.set(ga, e);
      }
      const pstr = pathToString(newPath);
      if (!gaToPaths.has(ga)) gaToPaths.set(ga, new Set<string>());
      if (pstr) gaToPaths.get(ga)!.add(pstr);
    }
    (n.children || []).forEach((c) => walk(c, newPath));
  })(root, [] as DepNode[]);
  return { forcedUpdates, gaToPaths };
}

export function computeDiff(oldRoot: DepNode, newRoot: DepNode): { mergedRoot: DepNode } {
  function mapByName(list: DepNode[] | undefined): Map<string, DepNode> {
    const m = new Map<string, DepNode>();
    (list || []).forEach((n) => m.set(n.name || "", n));
    return m;
  }

  function mergeNodes(
    oldNode: DepNode | undefined,
    newNode: DepNode | undefined,
    parent: DepNode | undefined,
    depth: number,
  ): DepNode {
    const name = (newNode?.name || oldNode?.name) as string;
    const declaredNew = newNode?.declaredVersion || "";
    const resolvedNew = newNode?.resolvedVersion || "";
    const declaredOld = oldNode?.declaredVersion || "";
    const resolvedOld = oldNode?.resolvedVersion || "";

    const existsOld = !!oldNode;
    const existsNew = !!newNode;

    const declared = existsNew ? declaredNew : declaredOld;
    const resolved = existsNew ? resolvedNew : resolvedOld;

    const status: "added" | "removed" | "changed" | "unchanged" =
      !existsOld && existsNew
        ? "added"
        : existsOld && !existsNew
          ? "removed"
          : declaredNew !== declaredOld || resolvedNew !== resolvedOld
            ? "changed"
            : "unchanged";

    const merged: DepNode = {
      id: existsNew ? newNode!.id : `removed|${oldNode!.id}`,
      name,
      declaredVersion: declared,
      resolvedVersion: resolved,
      prevDeclaredVersion: existsOld && existsNew ? declaredOld : undefined,
      prevResolvedVersion: existsOld && existsNew ? resolvedOld : undefined,
      status,
      children: [],
      parent,
      depth,
      collapsed: newNode?.collapsed ?? oldNode?.collapsed ?? true,
      descendantCount: 0,
    };

    const oldChildren = mapByName(oldNode?.children);
    const newChildren = mapByName(newNode?.children);

    // Preserve order: first new children order, then old-only
    const keys: string[] = [
      ...Array.from(newChildren.keys()),
      ...Array.from(oldChildren.keys()).filter((k) => !newChildren.has(k)),
    ];

    for (const k of keys) {
      const child = mergeNodes(oldChildren.get(k), newChildren.get(k), merged, depth + 1);
      merged.children.push(child);
    }

    return merged;
  }

  const mergedRoot = mergeNodes(oldRoot, newRoot, undefined, 0);
  computeDescendantCounts(mergedRoot);
  return { mergedRoot };
}

export function collectAllNodeIds(root: DepNode): Set<string> {
  const ids = new Set<string>();
  (function walk(n: DepNode) {
    ids.add(n.id);
    (n.children || []).forEach(walk);
  })(root);
  return ids;
}

export function hasMatchOrDesc(
  node: DepNode,
  q: string,
  textMatches: (q: string, node: DepNode) => boolean,
): boolean {
  if (textMatches(q, node)) return true;
  return (node.children || []).some((c) => hasMatchOrDesc(c, q, textMatches));
}

// Find a node in a tree by a human path string produced by pathToString
// Returns the found node and the list of ancestor nodes (excluding the root)
export function findNodeByPath(
  root: DepNode,
  path: string,
): { node: DepNode | undefined; ancestors: DepNode[] } {
  if (!root || !path) return { node: undefined, ancestors: [] };
  const parts = String(path).split("  ›  ").filter(Boolean);
  if (!parts.length) return { node: undefined, ancestors: [] };
  let cur: DepNode | undefined = root;
  const ancestors: DepNode[] = [];
  // Skip first segment if it is 'root'
  let i = parts[0] === "root" ? 1 : 0;
  for (; i < parts.length; i++) {
    const seg = parts[i];
    if (!cur) break;
    const next = (cur.children || []).find(
      (c) => `${c.name}${c.resolvedVersion ? ":" + c.resolvedVersion : ""}` === seg,
    );
    if (!next) break;
    ancestors.push(next);
    cur = next;
  }
  return { node: cur, ancestors };
}
