import { SvelteSet } from "svelte/reactivity";
import { findNodeByPath } from "../lib/tree/navigation";
import { domIdForNode } from "../lib/utils";
import type { DiffNode } from "../lib/types";

export function getPathsForDependency(gaToPaths: Map<string, Set<string>>, ga: string): string[] {
  const paths = gaToPaths.get(ga);
  return paths ? Array.from(paths) : [];
}

export function jumpToDiffPath(
  mergedRoot: DiffNode | null,
  expandedIds: Iterable<string>,
  path: string,
  setExpanded: (ids: SvelteSet<string>) => void,
  delayMs = 80,
  blinkMs = 1200,
): void {
  if (!mergedRoot) return;

  const { node, ancestors } = findNodeByPath(mergedRoot, path);
  if (!node) return;

  const ids = new SvelteSet<string>(expandedIds);
  ancestors.forEach((ancestor) => ids.add(ancestor.id));
  ids.add(node.id);
  setExpanded(ids);

  location.hash = "#diff";
  setTimeout(() => {
    const el = document.getElementById(domIdForNode({ id: node.id }));
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("blink");
    setTimeout(() => el.classList.remove("blink"), blinkMs);
  }, delayMs);
}
