import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildAnalysis } from "../../../src/lib/analysis/buildAnalysis";
import {
  deserializeAnalysisResult,
  serializeAnalysisResult,
} from "../../../src/lib/analysis/workerPayloads";
import { handleAnalysisWorkerRequest } from "../../../src/lib/analysis/analysisWorker";

function readSample(file: string): string {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("analysis/workerPayloads", () => {
  it("round-trips analysis results through worker-friendly DTOs", () => {
    const result = buildAnalysis({
      oldText: readSample("gradle-old.txt"),
      newText: readSample("gradle-new.txt"),
    });

    const dto = serializeAnalysisResult(result);
    const roundTrip = deserializeAnalysisResult(dto);

    expect(dto.activeTreeIndex?.ids).toEqual(result.activeTreeIndex?.ids);
    expect(roundTrip.activeTreeIndex?.ids).toEqual(result.activeTreeIndex?.ids);
    expect(roundTrip.parentIdsById).toEqual(result.parentIdsById);
    expect(roundTrip.forcedUpdates.get("org.jetbrains.kotlin:kotlin-stdlib")?.resolved).toBe(
      result.forcedUpdates.get("org.jetbrains.kotlin:kotlin-stdlib")?.resolved,
    );
  });

  it("handles worker requests through the exported message handler", () => {
    const response = handleAnalysisWorkerRequest({
      oldText: "",
      newText: readSample("gradle-new.txt"),
    });
    const result = deserializeAnalysisResult(response.result);

    expect(result.status).toBe("success");
    expect(result.mergedRoot?.name).toBe("root:root");
    expect(result.activeTreeIndex?.ids[0]).toBe(result.mergedRoot?.id);
  });
});
