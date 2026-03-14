import type { DependencyNode, ForcedUpdateInfo } from "../types";
import { hasForcedVersionChange, textMatches } from "../utils";
import { createPageSearch, type DependencyPageModel } from "./shared";

export type UpdatesFilterId = "showAll";

export interface UpdateListEntry {
  ga: string;
  resolved: string;
  declared: string;
  nodes: DependencyNode[];
  anyForced: boolean;
  paths: string[];
  requestedVersions: string[];
  forcedRequestedVersions: string[];
  strictVersions: string[];
}

export type UpdatesPageModel = DependencyPageModel<
  DependencyNode,
  UpdateListEntry,
  UpdatesFilterId,
  DependencyNode
>;

interface CreateUpdatesPageModelInput {
  root: DependencyNode | null;
  searchQuery: string;
  showAll: boolean;
  nodeIndexByGA: Map<string, DependencyNode[]>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  gaToPaths: Map<string, Set<string>>;
}

export function createUpdatesPageModel(input: CreateUpdatesPageModelInput): UpdatesPageModel {
  const search = createPageSearch<DependencyNode>(input.searchQuery, (node, query) =>
    textMatches(query, node),
  );
  const isProjectDependency = (ga: string): boolean => ga.startsWith("project:");

  function matchesEntry(ga: string, nodes: DependencyNode[]): boolean {
    if (!search.isActive) return true;
    if (ga.toLowerCase().includes(search.query.toLowerCase())) return true;
    return nodes.some((node) => search.matches(node));
  }

  function sortedValues(values: Set<string>): string[] {
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }

  function buildEntryDetails(ga: string, nodes: DependencyNode[]) {
    const requestedVersions = new Set<string>();
    const forcedRequestedVersions = new Set<string>();
    const strictVersions = new Set<string>();

    for (const node of nodes) {
      if (node.declaredVersion) requestedVersions.add(node.declaredVersion);
      if (node.strictlyVersion) strictVersions.add(node.strictlyVersion);
      if (hasForcedVersionChange(node.declaredVersion, node.resolvedVersion)) {
        forcedRequestedVersions.add(node.declaredVersion);
      }
    }

    return {
      paths: sortedValues(input.gaToPaths.get(ga) ?? new Set<string>()),
      requestedVersions: sortedValues(requestedVersions),
      forcedRequestedVersions: sortedValues(forcedRequestedVersions),
      strictVersions: sortedValues(strictVersions),
    };
  }

  const items: UpdateListEntry[] = [];

  if (input.root) {
    if (input.showAll) {
      for (const [ga, nodes] of input.nodeIndexByGA.entries()) {
        if (isProjectDependency(ga)) continue;
        if (!matchesEntry(ga, nodes)) continue;

        const resolvedSet = new Set(nodes.map((node) => node.resolvedVersion).filter(Boolean));
        const declaredSet = new Set(nodes.map((node) => node.declaredVersion).filter(Boolean));
        const details = buildEntryDetails(ga, nodes);

        items.push({
          ga,
          resolved: Array.from(resolvedSet).join(", ") || "-",
          declared: Array.from(declaredSet).join(", ") || "-",
          nodes,
          anyForced: nodes.some((node) =>
            hasForcedVersionChange(node.declaredVersion, node.resolvedVersion),
          ),
          paths: details.paths,
          requestedVersions: details.requestedVersions,
          forcedRequestedVersions: details.forcedRequestedVersions,
          strictVersions: details.strictVersions,
        });
      }
    } else {
      for (const [ga, forcedUpdate] of input.forcedUpdates.entries()) {
        if (!matchesEntry(ga, forcedUpdate.nodes)) continue;
        const details = buildEntryDetails(ga, forcedUpdate.nodes);

        items.push({
          ga,
          resolved: forcedUpdate.resolved,
          declared: Array.from(forcedUpdate.declared).join(", "),
          nodes: forcedUpdate.nodes,
          anyForced: true,
          paths: details.paths,
          requestedVersions: details.requestedVersions,
          forcedRequestedVersions: details.forcedRequestedVersions,
          strictVersions: details.strictVersions,
        });
      }
    }
  }

  items.sort((left, right) => left.ga.localeCompare(right.ga));

  return {
    search,
    filters: {
      showAll: {
        active: input.showAll,
        available: true,
      },
    },
    listing: {
      root: input.root,
      items,
    },
    hasData: !!input.root,
  };
}
