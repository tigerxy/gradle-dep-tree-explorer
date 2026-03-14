import { describe, it, expect } from "vitest";
import { buildAnalysis } from "../../../src/lib/analysis/buildAnalysis";
import {
  serializeAnalysisResult,
  deserializeAnalysisResult,
} from "../../../src/lib/analysis/workerPayloads";

describe("workerPayloads", () => {
  it("serializes and deserializes a full analysis result", () => {
    const analysis = buildAnalysis({
      newText: [
        "+--- com.acme:parent:1.0.0",
        "\\--- com.acme:child:1.0.0 -> 2.0.0",
        "     \\--- com.acme:leaf:2.0.0",
      ].join("\n"),
    });

    const dto = serializeAnalysisResult(analysis);
    const roundTrip = deserializeAnalysisResult(dto);

    expect(roundTrip.status).toBe("success");
    expect(roundTrip.newRoot?.name).toBe("root:root");
    expect(roundTrip.mergedRoot?.children[0].name).toBe("com.acme:parent");
    expect(roundTrip.forcedUpdates.size).toBeGreaterThan(0);
    expect(roundTrip.activeTreeIndex?.ids.length).toBe(dto.activeTreeIndex?.ids.length);
    expect(roundTrip.gaToPaths.get("com.acme:parent")?.size).toBeGreaterThan(0);
  });

  it("handles empty analysis state", () => {
    const analysis = buildAnalysis({ newText: "" });
    const dto = serializeAnalysisResult(analysis);
    const roundTrip = deserializeAnalysisResult(dto);

    expect(roundTrip.status).toBe("error");
    expect(roundTrip.newRoot).toBeNull();
    expect(roundTrip.activeTreeIndex).toBeNull();
    expect(roundTrip.gaToPaths.size).toBe(0);
  });
});
