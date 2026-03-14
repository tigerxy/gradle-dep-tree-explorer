import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseGradleTreeWithDiagnostics } from "../../../src/lib/parser/gradleTreeParser";

function readFixture(name: string): string {
  return fs.readFileSync(path.resolve("tests/fixtures/parser", name), "utf8");
}

describe("parser/gradleTreeParser fixtures", () => {
  it("parses a simple dependency tree fixture", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("simple-tree.txt"));

    expect(result.root.children.map((node) => node.name)).toEqual([
      "com.example:app",
      "org.example:tool",
    ]);
    expect(result.root.children[0]?.children.map((node) => node.name)).toEqual([
      "com.example:core",
      "com.example:ui",
    ]);
    expect(result.diagnostics).toEqual([]);
  });

  it("parses forced update fixtures and preserves declared versus resolved versions", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("forced-updates.txt"));

    expect(result.root.children).toEqual([
      expect.objectContaining({
        name: "org.example:alpha",
        declaredVersion: "1.0.0",
        resolvedVersion: "1.5.0",
      }),
      expect.objectContaining({
        name: "org.example:beta",
        declaredVersion: "2.0.0",
        resolvedVersion: "2.1.0",
      }),
    ]);
  });

  it("parses project dependency fixtures", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("project-dependencies.txt"));

    expect(result.root.children).toEqual([
      expect.objectContaining({
        name: "project:shared",
        declaredVersion: "",
        resolvedVersion: "",
      }),
      expect.objectContaining({
        name: "project:feature-login",
        declaredVersion: "",
        resolvedVersion: "",
      }),
    ]);
  });

  it("reports malformed fixture diagnostics while keeping partial tree output", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("malformed-lines.txt"));

    expect(result.root.children[0]?.name).toBe("com.example:root");
    expect(result.root.children[0]?.children[0]).toMatchObject({
      name: "com.example:deep",
      depth: 1,
    });
    expect(result.root.children[1]?.name).toBe("\\--- nonsense");
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ambiguous-structure", line: 2 }),
        expect.objectContaining({ code: "unrecognized-line", line: 3 }),
      ]),
    );
  });

  it("normalizes Gradle star dependency fixtures", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("star-dependencies.txt"));

    expect(result.root.children[1]).toMatchObject({
      name: "org.example:child",
      declaredVersion: "1.0.0",
      resolvedVersion: "1.0.0",
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("parses special Gradle dependency metadata without fallback diagnostics", () => {
    const result = parseGradleTreeWithDiagnostics(readFixture("special-deps.txt"));

    expect(result.diagnostics.every((diagnostic) => diagnostic.code !== "unsupported-format")).toBe(
      true,
    );
    expect(result.root.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "project:app" }),
        expect.objectContaining({ name: "project:benchmark" }),
        expect.objectContaining({
          name: "com.fasterxml.jackson.core:jackson-databind",
          declaredVersion: "{strictly 2.17.2}",
          resolvedVersion: "{strictly 2.17.2}",
        }),
        expect.objectContaining({
          name: "org.some:unresolved-module",
          declaredVersion: "1.2.3",
          resolvedVersion: "",
        }),
      ]),
    );
  });
});
