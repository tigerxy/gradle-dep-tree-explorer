import { describe, expect, it } from "vitest";
import {
  parseGradleTree,
  parseGradleTreeWithDiagnostics,
} from "../../../src/lib/parser/gradleTreeParser";

describe("parser/gradleTreeParser", () => {
  it("parses modules, project dependencies, version substitutions, and collapsed markers", () => {
    const root = parseGradleTree(`
+--- com.example:root-lib:1.0.0
|    +--- project :shared
|    \\--- com.example:child-lib:1.0.0 -> 1.1.0 (*)
`);

    expect(root.children[0]).toMatchObject({
      id: "root/com.example-root-lib@1.0.0:0",
      name: "com.example:root-lib",
      declaredVersion: "1.0.0",
      resolvedVersion: "1.0.0",
    });
    expect(root.children[0]?.children).toEqual([
      expect.objectContaining({
        name: "project:shared",
        resolvedVersion: "project",
      }),
      expect.objectContaining({
        name: "com.example:child-lib",
        declaredVersion: "1.0.0",
        resolvedVersion: "1.1.0",
      }),
    ]);
  });

  it("emits fallback and unrecognized diagnostics while preserving partial output", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- com.example:root:1.0.0
|    \\--- com.example:child
\\--- nonsense
`);

    expect(result.lines).toEqual([
      expect.objectContaining({ kind: "module", artifact: "root" }),
      expect.objectContaining({
        kind: "module",
        artifact: "child",
        declaredVersion: "",
        resolvedVersion: "",
      }),
      expect.objectContaining({ kind: "unknown" }),
    ]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "unsupported-format",
        line: 3,
      }),
      expect.objectContaining({
        code: "unrecognized-line",
        line: 4,
      }),
    ]);
    expect(result.root.children[1]).toMatchObject({ name: "\\--- nonsense" });
  });

  it("attaches skipped depths to the nearest known parent", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- com.example:root:1.0.0
|         +--- com.example:deep:2.0.0
`);

    expect(result.root.children[0]?.children[0]).toMatchObject({
      name: "com.example:deep",
      depth: 1,
    });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "ambiguous-structure",
        line: 3,
        depth: 2,
      }),
    ]);
  });
});
