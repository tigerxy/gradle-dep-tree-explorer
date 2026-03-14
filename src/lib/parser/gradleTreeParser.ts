import { computeDescendantCounts } from "../tree/descendants";
import type {
  DependencyNode,
  ParseDiagnostic,
  ParsedDependencyLine,
  ParseGradleTreeResult,
} from "../types";

function slugifyIdPart(value: string): string {
  return (value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function buildNodeId(
  parentId: string,
  name: string,
  resolvedVersion: string,
  siblingIndex: number,
): string {
  const namePart = slugifyIdPart(name) || "unnamed";
  const versionPart = slugifyIdPart(resolvedVersion) || "nover";
  return `${parentId}/${namePart}@${versionPart}:${siblingIndex}`;
}

export function parseGradleTree(text: string): DependencyNode {
  return parseGradleTreeWithDiagnostics(text).root;
}

export function parseGradleTreeWithDiagnostics(text: string): ParseGradleTreeResult {
  const lines = tokenizeDependencyLines(text);
  return buildDependencyTree(lines);
}

function tokenizeDependencyLines(text: string): {
  lines: ParsedDependencyLine[];
  diagnostics: ParseDiagnostic[];
} {
  const rawLines = (text || "").split(/\r?\n/);
  const parsedLines: ParsedDependencyLine[] = [];
  const diagnostics: ParseDiagnostic[] = [];
  const projRe = /project\s*:(\S+)/;

  for (const [index, raw] of rawLines.entries()) {
    const line = raw.replace(/\t/g, "    ");
    const idxPlus = line.indexOf("+---");
    const idxBack = line.indexOf("\\---");
    if (idxPlus === -1 && idxBack === -1) {
      continue;
    }

    const idx = idxPlus !== -1 ? idxPlus : idxBack;
    const depth = Math.max(0, Math.round(idx / 5));
    const rest = line.slice(idx + 4).trim();
    const lineNumber = index + 1;
    const parsedModule = parseModuleDependency(rest);

    if (parsedModule) {
      parsedLines.push({
        line: lineNumber,
        depth,
        kind: "module",
        group: parsedModule.group,
        artifact: parsedModule.artifact,
        declaredVersion: parsedModule.declaredVersion,
        resolvedVersion: parsedModule.resolvedVersion,
        strictlyVersion: parsedModule.strictlyVersion,
        raw,
      });
      continue;
    }

    const projectMatch = rest.match(projRe);
    if (projectMatch) {
      parsedLines.push({
        line: lineNumber,
        depth,
        kind: "project",
        group: "project",
        artifact: projectMatch[1],
        declaredVersion: "",
        resolvedVersion: "",
        raw,
      });
      continue;
    }

    const token = rest.split(/\s+/)[0] || "";
    const parts = token.split(":");
    if (parts.length >= 2) {
      parsedLines.push({
        line: lineNumber,
        depth,
        kind: "module",
        group: parts[0],
        artifact: parts[1],
        declaredVersion: parts[2] || "",
        resolvedVersion: normalizeVersion(parts[2] || ""),
        raw,
      });
      diagnostics.push({
        code: "unsupported-format",
        severity: "warning",
        message: "Parsed dependency line using fallback token parsing.",
        line: lineNumber,
        raw,
        depth,
      });
      continue;
    }

    parsedLines.push({
      line: lineNumber,
      depth,
      kind: "unknown",
      raw,
    });
    diagnostics.push({
      code: "unrecognized-line",
      severity: "warning",
      message: "Could not recognize dependency coordinates on this line.",
      line: lineNumber,
      raw,
      depth,
    });
  }

  return { lines: parsedLines, diagnostics };
}

function parseModuleDependency(
  rawValue: string,
): Pick<
  ParsedDependencyLine,
  "group" | "artifact" | "declaredVersion" | "resolvedVersion" | "strictlyVersion"
> | null {
  let value = rawValue.trim();
  if (!value) return null;

  const becauseIndex = value.indexOf(" because ");
  if (becauseIndex !== -1) {
    value = value.slice(0, becauseIndex).trim();
  }

  let isFailed = false;
  if (value.endsWith(" FAILED")) {
    isFailed = true;
    value = value.slice(0, -7).trim();
  }

  let marker = "";
  const markerMatch = value.match(/\s+\((\*|c|n)\)$/);
  if (markerMatch) {
    marker = markerMatch[1] || "";
    value = value.slice(0, markerMatch.index).trim();
  }

  const [leftSide, rightSide] = value.split(/\s+->\s+/, 2);
  const coordinateMatch = leftSide?.match(/^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)(?::([^:]+))?$/);
  if (!coordinateMatch) return null;

  const declaredVersion = normalizeVersion(coordinateMatch[3] || "");
  const strictlyVersion = extractStrictlyVersion(declaredVersion);
  const normalizedDeclaredVersion = strictlyVersion || declaredVersion;
  const resolvedVersion = normalizeResolvedVersion({
    declaredVersion: normalizedDeclaredVersion,
    selectedVersion: rightSide || "",
    isFailed,
    marker,
  });

  return {
    group: coordinateMatch[1],
    artifact: coordinateMatch[2],
    declaredVersion: normalizedDeclaredVersion,
    resolvedVersion,
    strictlyVersion: strictlyVersion || undefined,
  };
}

function buildDependencyTree(tokenized: {
  lines: ParsedDependencyLine[];
  diagnostics: ParseDiagnostic[];
}): ParseGradleTreeResult {
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
  const childCountsByParentId = new Map<string, number>();
  const diagnostics = [...tokenized.diagnostics];

  for (const parsedLine of tokenized.lines) {
    let depth = parsedLine.depth;
    if (depth > stack.length - 1) {
      diagnostics.push({
        code: "ambiguous-structure",
        severity: "warning",
        message: "Dependency depth skipped levels; attached to the nearest known parent.",
        line: parsedLine.line,
        raw: parsedLine.raw,
        depth,
      });
      depth = stack.length - 1;
    }

    while (stack.length > depth + 1) stack.pop();
    const parent = stack[stack.length - 1];
    const name = buildDependencyName(parsedLine);
    const declaredVersion = parsedLine.declaredVersion || "";
    const resolvedVersion = parsedLine.resolvedVersion ?? declaredVersion;
    const strictlyVersion = parsedLine.strictlyVersion || undefined;
    const nextSiblingIndex = childCountsByParentId.get(parent.id) ?? 0;
    childCountsByParentId.set(parent.id, nextSiblingIndex + 1);
    const node: DependencyNode = {
      id: buildNodeId(parent.id, name, resolvedVersion, nextSiblingIndex),
      name,
      declaredVersion,
      resolvedVersion,
      strictlyVersion,
      children: [],
      depth,
      descendantCount: 0,
    };
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  computeDescendantCounts(root);
  return {
    root,
    lines: tokenized.lines,
    diagnostics,
  };
}

function buildDependencyName(parsedLine: ParsedDependencyLine): string {
  if (parsedLine.kind === "project") {
    return `project:${parsedLine.artifact || ""}`;
  }

  if (parsedLine.group && parsedLine.artifact) {
    return `${parsedLine.group}:${parsedLine.artifact}`;
  }

  return parsedLine.raw.trim();
}

function normalizeVersion(version: string): string {
  return (version || "").replace(/\s+\(.+\)$/, "").replace(/\*\)$/, "");
}

function normalizeResolvedVersion(input: {
  declaredVersion: string;
  selectedVersion: string;
  isFailed: boolean;
  marker: string;
}): string {
  if (input.selectedVersion) {
    return normalizeVersion(input.selectedVersion);
  }

  if (input.isFailed || input.marker === "n") {
    return "";
  }

  return input.declaredVersion;
}

function extractStrictlyVersion(version: string): string {
  const match = (version || "").trim().match(/^\{strictly\s+(.+)\}$/);
  return match?.[1] || "";
}
