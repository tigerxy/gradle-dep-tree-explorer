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

  it("falls back to token parsing for unconventional lines and keeps raw names", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- weird:artifact:1.0.0:extra
|    +--- weird:artifact
\\--- project :example
`);

    expect(result.diagnostics.some((d) => d.code === "unsupported-format")).toBe(true);
    // first line gets parsed via fallback token split
    expect(result.lines[0]).toMatchObject({
      kind: "module",
      artifact: "artifact",
      resolvedVersion: "1.0.0:extra",
    });
    // ensure buildDependencyName preserves raw when group/artifact missing
    expect(result.root.children[0]?.name).toBe("weird:artifact");
  });

  it("parses modules without resolved versions and preserves raw unknowns", () => {
    const result = parseGradleTreeWithDiagnostics(`
\\--- org.example:plain
\\--- ????
`);

    expect(result.lines[0]).toMatchObject({
      declaredVersion: "",
      resolvedVersion: "",
    });
    const unknown = result.lines.find((line) => line.kind === "unknown");
    expect(unknown?.raw.trim()).toBe("\\--- ????");
    expect(result.root.children.some((c) => c.name === "\\--- ????")).toBe(true);
  });

  it("ignores lines without dependency markers and normalizes substituted versions", () => {
    const result = parseGradleTreeWithDiagnostics(`
random text
+--- org.example:artifact:1.0.0 -> 1.0.0 (supplied)
`);

    const line = result.lines.find((l) => l.artifact === "artifact");
    expect(line?.resolvedVersion).toBe("1.0.0");
    expect(result.diagnostics.every((d) => d.code !== "unrecognized-line")).toBe(true);
  });

  it("handles undefined input safely and keeps project dependencies named", () => {
    // @ts-expect-error intentional runtime coverage for undefined input
    const result = parseGradleTreeWithDiagnostics(undefined);
    expect(result.lines).toEqual([]);

    const projectResult = parseGradleTreeWithDiagnostics(`
+--- project :shared
`);
    expect(projectResult.root.children[0]?.name).toBe("project:shared");
  });

  it("captures resolved versions from substitution arrows", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- org.example:subbed:1.0.0 -> 2.0.0
`);

    const subbed = result.lines.find((l) => l.artifact === "subbed");
    expect(subbed?.declaredVersion).toBe("1.0.0");
    expect(subbed?.resolvedVersion).toBe("2.0.0");
  });
});
