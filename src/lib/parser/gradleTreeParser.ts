import { computeDescendantCounts } from "../tree/descendants";
import type { DependencyNode } from "../types";

export function parseGradleTree(text: string): DependencyNode {
  const lines = (text || "").split(/\r?\n/);
  const root: DependencyNode = {
    id: "root",
    name: "root:root",
    declaredVersion: "",
    resolvedVersion: "",
    children: [],
    depth: 0,
    descendantCount: 0,
  };
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

    let gaName: string;
    let name: string;
    let declaredVersion = "";
    let resolvedVersion = "";
    const gavMatch = rest.match(gavRe);
    if (gavMatch) {
      gaName = gavMatch[1];
      declaredVersion = gavMatch[2] || "";
      resolvedVersion = (gavMatch[3] || declaredVersion || "").replace(/\*\)$/, "");
      name = gaName;
    } else {
      const projectMatch = rest.match(projRe);
      if (projectMatch) {
        gaName = `project:${projectMatch[1]}`;
        declaredVersion = "project";
        resolvedVersion = "project";
        name = gaName;
      } else {
        const token = rest.split(/\s+/)[0];
        const parts = token.split(":");
        if (parts.length >= 2) {
          gaName = `${parts[0]}:${parts[1]}`;
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
    const node: DependencyNode = {
      id: `${gaName}|${resolvedVersion}|${Math.random().toString(36).slice(2)}`,
      name,
      declaredVersion,
      resolvedVersion,
      children: [],
      depth,
      descendantCount: 0,
    };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  computeDescendantCounts(root);
  return root;
}
