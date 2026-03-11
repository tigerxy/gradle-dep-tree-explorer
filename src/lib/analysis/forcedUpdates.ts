import { pathToString } from "../utils";
import type { DependencyNode, ForcedUpdateInfo } from "../types";

export function computeForcedUpdates(root: DependencyNode): {
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  gaToPaths: Map<string, Set<string>>;
} {
  const forcedUpdates = new Map<string, ForcedUpdateInfo>();
  const gaToPaths = new Map<string, Set<string>>();

  (function walk(node: DependencyNode, path: DependencyNode[]) {
    const here = node.name === "root:root" ? [] : [node];
    const newPath = here.length ? [...path, node] : path;
    if (node.name && node.name !== "root:root") {
      const ga = node.name;
      const declared = node.declaredVersion || "";
      const resolved = node.resolvedVersion || "";
      if (declared && resolved && declared !== resolved) {
        const entry: ForcedUpdateInfo = forcedUpdates.get(ga) || {
          resolved,
          declared: new Set<string>(),
          nodes: [],
          paths: new Set<string>(),
        };
        entry.declared.add(declared);
        entry.nodes.push(node);
        entry.resolved = resolved;
        forcedUpdates.set(ga, entry);
      }
      const pathString = pathToString(newPath);
      if (!gaToPaths.has(ga)) gaToPaths.set(ga, new Set<string>());
      if (pathString) gaToPaths.get(ga)!.add(pathString);
    }
    node.children.forEach((child) => walk(child, newPath));
  })(root, []);

  return { forcedUpdates, gaToPaths };
}
