import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildAnalysis } from "../../src/lib/analysis/buildAnalysis";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("buildAnalysis", () => {
  it("builds a single-tree analysis when no old tree is provided", () => {
    const newText = readSample("gradle-new.txt");

    const result = buildAnalysis({ newText });

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
});
