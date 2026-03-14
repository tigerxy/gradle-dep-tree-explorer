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
        declaredVersion: "",
        resolvedVersion: "",
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
      resolvedVersion: "1.0.0",
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
    expect(projectResult.root.children[0]).toMatchObject({
      name: "project:shared",
      declaredVersion: "",
      resolvedVersion: "",
    });
  });

  it("captures resolved versions from substitution arrows", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- org.example:subbed:1.0.0 -> 2.0.0
`);

    const subbed = result.lines.find((l) => l.artifact === "subbed");
    expect(subbed?.declaredVersion).toBe("1.0.0");
    expect(subbed?.resolvedVersion).toBe("2.0.0");
  });

  it("parses arrow-only substitutions without fallback diagnostics", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- androidx.compose.ui:ui-tooling-preview -> 1.10.0-beta02
|    \\--- org.jetbrains.kotlin:kotlin-stdlib -> 2.3.0 (*)
`);

    expect(result.lines).toEqual([
      expect.objectContaining({
        group: "androidx.compose.ui",
        artifact: "ui-tooling-preview",
        declaredVersion: "",
        resolvedVersion: "1.10.0-beta02",
      }),
      expect.objectContaining({
        group: "org.jetbrains.kotlin",
        artifact: "kotlin-stdlib",
        declaredVersion: "",
        resolvedVersion: "2.3.0",
      }),
    ]);
    expect(result.diagnostics.every((d) => d.code !== "unsupported-format")).toBe(true);
  });

  it("parses Gradle metadata variants without fallback diagnostics", () => {
    const result = parseGradleTreeWithDiagnostics(`
+--- androidx.core:core-ktx:{strictly 1.13.1} -> 1.13.1
+--- com.google.firebase:firebase-analytics:22.1.0 (c)
+--- org.jetbrains.kotlin:kotlin-stdlib:2.0.21 -> 2.1.20
+--- org.some.vendor:missing-artifact:2.0 FAILED
+--- org.some:unresolved-module:1.2.3 (n)
+--- org.slf4j:slf4j-api:2.0.13 (*)
+--- com.fasterxml.jackson.core:jackson-databind:{strictly 2.17.2} because CVE remediation
+--- com.google.firebase:firebase-analytics
`);

    expect(result.lines).toEqual([
      expect.objectContaining({
        group: "androidx.core",
        artifact: "core-ktx",
        declaredVersion: "{strictly 1.13.1}",
        resolvedVersion: "1.13.1",
      }),
      expect.objectContaining({
        group: "com.google.firebase",
        artifact: "firebase-analytics",
        declaredVersion: "22.1.0",
        resolvedVersion: "22.1.0",
      }),
      expect.objectContaining({
        group: "org.jetbrains.kotlin",
        artifact: "kotlin-stdlib",
        declaredVersion: "2.0.21",
        resolvedVersion: "2.1.20",
      }),
      expect.objectContaining({
        group: "org.some.vendor",
        artifact: "missing-artifact",
        declaredVersion: "2.0",
        resolvedVersion: "",
      }),
      expect.objectContaining({
        group: "org.some",
        artifact: "unresolved-module",
        declaredVersion: "1.2.3",
        resolvedVersion: "",
      }),
      expect.objectContaining({
        group: "org.slf4j",
        artifact: "slf4j-api",
        declaredVersion: "2.0.13",
        resolvedVersion: "2.0.13",
      }),
      expect.objectContaining({
        group: "com.fasterxml.jackson.core",
        artifact: "jackson-databind",
        declaredVersion: "{strictly 2.17.2}",
        resolvedVersion: "{strictly 2.17.2}",
      }),
      expect.objectContaining({
        group: "com.google.firebase",
        artifact: "firebase-analytics",
        declaredVersion: "",
        resolvedVersion: "",
      }),
    ]);
    expect(result.diagnostics.every((d) => d.code !== "unsupported-format")).toBe(true);
  });
});
