import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildAnalysis } from "../../../src/lib/analysis/buildAnalysis";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("buildAnalysis", () => {
  it("builds a single-tree analysis when no old tree is provided", () => {
    const newText = readSample("gradle-new.txt");

    const result = buildAnalysis({ newText });

    expect(result.status).toBe("success");
    expect(result.issues).toEqual([]);
    expect(result.oldRoot).toBeNull();
    expect(result.diffAvailable).toBe(false);
    expect(result.mergedRoot).not.toBe(result.newRoot);
    expect(result.mergedRoot.status).toBe("unchanged");
    expect(result.nodeIndexByGA.has("org.jetbrains.kotlin:kotlin-stdlib")).toBe(true);
    expect(result.forcedUpdates.has("org.jetbrains.kotlin:kotlin-stdlib")).toBe(true);
  });

  it("builds a diff analysis and keeps derived indexes available", () => {
    const oldText = readSample("gradle-old.txt");
    const newText = readSample("gradle-new.txt");

    const result = buildAnalysis({ oldText, newText });
    const changedNode = result.mergedRoot.children.find(
      (child) => child.name === "io.insert-koin:koin-androidx-compose",
    );

    expect(result.oldRoot).toBeTruthy();
    expect(result.diffAvailable).toBe(true);
    expect(changedNode?.status).toBe("changed");
    expect(result.gaToPaths.get("org.jetbrains.kotlin:kotlin-stdlib")?.size).toBeGreaterThan(0);
  });

  it("exposes parse diagnostics for old and new trees", () => {
    const result = buildAnalysis({
      oldText: "+--- broken",
      newText: "+--- com.example:ok:1.0.0\n|         +--- com.example:child:2.0.0",
    });

    expect(result.status).toBe("success-with-warnings");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "validation",
          code: "empty-old-tree",
        }),
        expect.objectContaining({
          source: "new",
          code: "ambiguous-structure",
          line: 2,
        }),
        expect.objectContaining({
          source: "old",
          code: "unrecognized-line",
          line: 1,
        }),
      ]),
    );
    expect(result.issues).toHaveLength(3);
    expect(result.oldParseDiagnostics).toEqual([
      expect.objectContaining({
        code: "unrecognized-line",
        line: 1,
      }),
    ]);
    expect(result.newParseDiagnostics).toEqual([
      expect.objectContaining({
        code: "ambiguous-structure",
        line: 2,
      }),
    ]);
  });

  it("returns an error result when the current tree is missing or unparseable", () => {
    const missing = buildAnalysis({ newText: "   " });
    const empty = buildAnalysis({ newText: "plain text only" });

    expect(missing.status).toBe("error");
    expect(missing.issues).toEqual([
      expect.objectContaining({
        code: "missing-current-tree",
        severity: "error",
      }),
    ]);
    expect(missing.mergedRoot).toBeNull();

    expect(empty.status).toBe("error");
    expect(empty.issues).toEqual([
      expect.objectContaining({
        code: "empty-current-tree",
        severity: "error",
      }),
    ]);
    expect(empty.newRoot).toBeNull();
  });
});
