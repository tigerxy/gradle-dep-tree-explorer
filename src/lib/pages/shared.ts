export interface PageSearch<TNode> {
  query: string;
  isActive: boolean;
  matches: (node: TNode) => boolean;
}

export interface PageFilterState {
  active: boolean;
  available: boolean;
}

export interface PageListing<TItem, TRoot = TItem> {
  root: TRoot | null;
  items: readonly TItem[];
}

export interface DependencyPageModel<
  TNode,
  TItem = TNode,
  TFilterId extends string = never,
  TRoot = TNode,
> {
  search: PageSearch<TNode>;
  filters: Readonly<Record<TFilterId, PageFilterState>>;
  listing: PageListing<TItem, TRoot>;
  hasData: boolean;
}

export function createPageSearch<TNode>(
  query: string,
  matcher: (node: TNode, normalizedQuery: string) => boolean,
): PageSearch<TNode> {
  const normalizedQuery = (query || "").trim();

  return {
    query: normalizedQuery,
    isActive: normalizedQuery.length > 0,
    matches(node: TNode): boolean {
      return matcher(node, normalizedQuery);
    },
  };
}

export function flattenTree<TNode extends { children: TNode[] }>(root: TNode | null): TNode[] {
  if (!root) return [];

  const items: TNode[] = [];
  const stack: TNode[] = [root];

  while (stack.length) {
    const node = stack.pop() as TNode;
    items.push(node);

    for (let i = node.children.length - 1; i >= 0; i -= 1) {
      stack.push(node.children[i]);
    }
  }

  return items;
}
