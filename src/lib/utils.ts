export function mvnUrl(ga: string, version?: string): string {
  const [g, a] = (ga || "").split(":");
  return version
    ? `https://mvnrepository.com/artifact/${g}/${a}/${encodeURIComponent(version)}`
    : `https://mvnrepository.com/artifact/${g}/${a}`;
}

import type { DependencyNode, DiffNode } from "./types";

const STRICT_VERSION_RE = /^\{strictly\s+(.+)\}$/;

type SearchableNode = Pick<
  DependencyNode | DiffNode,
  "name" | "declaredVersion" | "resolvedVersion"
>;

export function textMatches(q: string, node: SearchableNode): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  const hay =
    `${node.name || ""}:${node.declaredVersion || ""}:${node.resolvedVersion || ""}`.toLowerCase();
  return hay.includes(s);
}

export function pathToString(
  nodes: Array<Pick<DependencyNode, "name" | "resolvedVersion">>,
): string {
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

export function extractStrictVersion(version: string): string | null {
  const match = (version || "").trim().match(STRICT_VERSION_RE);
  return match?.[1] || null;
}

export function displayVersion(version: string): string {
  return extractStrictVersion(version) || version;
}

export function isStrictVersion(version: string): boolean {
  return extractStrictVersion(version) !== null;
}

export function hasForcedVersionChange(declaredVersion: string, resolvedVersion: string): boolean {
  if (!declaredVersion || !resolvedVersion) return false;
  return displayVersion(declaredVersion) !== resolvedVersion;
}
