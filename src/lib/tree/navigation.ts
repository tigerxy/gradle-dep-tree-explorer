type TreeNodeLike<TNode> = {
  name: string;
  resolvedVersion: string;
  children: TNode[];
};

export function hasMatchOrDesc<TNode extends TreeNodeLike<TNode>>(
  node: TNode,
  q: string,
  textMatches: (q: string, node: TNode) => boolean,
): boolean {
  if (textMatches(q, node)) return true;
  return node.children.some((child) => hasMatchOrDesc(child, q, textMatches));
}

export function findNodeByPath<TNode extends TreeNodeLike<TNode>>(
  root: TNode,
  path: string,
): { node: TNode | undefined; ancestors: TNode[] } {
  if (!root || !path) return { node: undefined, ancestors: [] };
  const parts = String(path).split("  ›  ").filter(Boolean);
  if (!parts.length) return { node: undefined, ancestors: [] };

  let current: TNode = root;
  const ancestors: TNode[] = [];
  let i = parts[0] === "root" ? 1 : 0;
  for (; i < parts.length; i++) {
    const segment = parts[i];
    const next: TNode | undefined = current.children.find(
      (child) =>
        `${child.name}${child.resolvedVersion ? ":" + child.resolvedVersion : ""}` === segment,
    );
    if (!next) break;
    ancestors.push(next);
    current = next;
  }

  return { node: current, ancestors };
}
