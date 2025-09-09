export function mvnUrl(ga: string, version?: string): string {
  const [g, a] = (ga || "").split(":");
  return version
    ? `https://mvnrepository.com/artifact/${g}/${a}/${encodeURIComponent(version)}`
    : `https://mvnrepository.com/artifact/${g}/${a}`;
}

import type { DepNode } from "./types";

export function textMatches(q: string, node: DepNode): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  const hay =
    `${node.name || ""}:${node.declaredVersion || ""}:${node.resolvedVersion || ""}`.toLowerCase();
  return hay.includes(s);
}

export function pathToString(nodes: DepNode[]): string {
  if (!nodes || !nodes.length) return "";
  return nodes
    .map((n) =>
      n.name === "root:root"
        ? "root"
        : `${n.name}${n.resolvedVersion ? ":" + n.resolvedVersion : ""}`,
    )
    .join("  ›  ");
}

export function domIdForNode(node: { id?: string } | null | undefined): string {
  // stable, safe DOM id per node id
  const base = String(node?.id || "node").replace(/[^A-Za-z0-9_-]/g, "_");
  return `node-${base}`;
}

export function prefersDarkMode() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
