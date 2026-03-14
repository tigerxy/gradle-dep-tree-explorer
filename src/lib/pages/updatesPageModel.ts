import type { DependencyNode, ForcedUpdateInfo } from "../types";
import { hasForcedVersionChange, pathToString, textMatches } from "../utils";
import { createPageSearch, type DependencyPageModel } from "./shared";

export type UpdatesFilterId = "showAll";

export interface UpdatePathGroup {
  kind: "strict" | "requested" | "forced";
  version: string;
  paths: string[];
}

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
  pathGroups: UpdatePathGroup[];
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

  const pathEvidenceByGA = new Map<
    string,
    Array<Pick<UpdatePathGroup, "kind" | "version"> & { path: string }>
  >();

  if (input.root) {
    (function collectPathEvidence(node: DependencyNode, path: DependencyNode[]) {
      const nextPath = node.name === "root:root" ? path : [...path, node];
      if (node.name && node.name !== "root:root") {
        let kind: UpdatePathGroup["kind"];
        let version: string;

        if (node.strictlyVersion) {
          kind = "strict";
          version = node.strictlyVersion;
        } else if (hasForcedVersionChange(node.declaredVersion, node.resolvedVersion)) {
          kind = "forced";
          version = node.declaredVersion;
        } else {
          kind = "requested";
          version = node.declaredVersion || node.resolvedVersion;
        }

        const entry = {
          kind,
          version,
          path: pathToString(nextPath),
        };
        const bucket = pathEvidenceByGA.get(node.name);
        if (bucket) {
          bucket.push(entry);
        } else {
          pathEvidenceByGA.set(node.name, [entry]);
        }
      }

      node.children.forEach((child) => collectPathEvidence(child, nextPath));
    })(input.root, []);
  }

  function buildPathGroups(ga: string, nodes: DependencyNode[]): UpdatePathGroup[] {
    void nodes;
    const pathBuckets = new Map<string, Set<string>>();
    const evidence = pathEvidenceByGA.get(ga) ?? [];

    for (const entry of evidence) {
      const bucketKey = `${entry.kind}|${entry.version}`;
      if (!pathBuckets.has(bucketKey)) pathBuckets.set(bucketKey, new Set<string>());
      pathBuckets.get(bucketKey)?.add(entry.path);
    }

    const grouped = Array.from(pathBuckets.entries())
      .map(([key, groupedPaths]) => {
        const [kind, version] = key.split("|", 2) as [UpdatePathGroup["kind"], string];
        return {
          kind,
          version,
          paths: sortedValues(groupedPaths),
        };
      })
      .sort((left, right) => {
        const order = { strict: 0, requested: 1, forced: 2 };
        const kindCompare = order[left.kind] - order[right.kind];
        if (kindCompare !== 0) return kindCompare;
        return left.version.localeCompare(right.version);
      });

    return grouped;
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
      paths: sortedValues(new Set((pathEvidenceByGA.get(ga) ?? []).map((entry) => entry.path))),
      requestedVersions: sortedValues(requestedVersions),
      forcedRequestedVersions: sortedValues(forcedRequestedVersions),
      strictVersions: sortedValues(strictVersions),
      pathGroups: buildPathGroups(ga, nodes),
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
          pathGroups: details.pathGroups,
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
          pathGroups: details.pathGroups,
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
