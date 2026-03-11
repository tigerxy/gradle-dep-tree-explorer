import type { DepNode } from "../types";

export function hasMatchOrDesc(
  node: DepNode,
  q: string,
  textMatches: (q: string, node: DepNode) => boolean,
): boolean {
  if (textMatches(q, node)) return true;
  return (node.children || []).some((child) => hasMatchOrDesc(child, q, textMatches));
}

export function findNodeByPath(
  root: DepNode,
  path: string,
): { node: DepNode | undefined; ancestors: DepNode[] } {
  if (!root || !path) return { node: undefined, ancestors: [] };
  const parts = String(path).split("  ›  ").filter(Boolean);
  if (!parts.length) return { node: undefined, ancestors: [] };

  let current: DepNode | undefined = root;
  const ancestors: DepNode[] = [];
  let i = parts[0] === "root" ? 1 : 0;
  for (; i < parts.length; i++) {
    const segment = parts[i];
    if (!current) break;
    const next: DepNode | undefined = (current.children || []).find(
      (child) =>
        `${child.name}${child.resolvedVersion ? ":" + child.resolvedVersion : ""}` === segment,
    );
    if (!next) break;
    ancestors.push(next);
    current = next;
  }

  return { node: current, ancestors };
}
