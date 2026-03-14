import { describe, it, expect, vi, afterEach } from "vitest";
import { handleAnalysisWorkerRequest } from "../../../src/lib/analysis/analysisWorker";

type TestWorkerScope = typeof globalThis & {
  importScripts?: (...urls: string[]) => void;
  onmessage?: ((event: MessageEvent<unknown>) => void) | null;
};

const workerScope = globalThis as TestWorkerScope;
const originalPostMessage = workerScope.postMessage;
const originalImportScripts = workerScope.importScripts;
const originalOnMessage = workerScope.onmessage;

afterEach(() => {
  workerScope.postMessage = originalPostMessage;
  workerScope.importScripts = originalImportScripts;
  workerScope.onmessage = originalOnMessage;
  vi.resetModules();
});

describe("analysisWorker", () => {
  it("handles requests through the helper", () => {
    const { result } = handleAnalysisWorkerRequest({
      newText: "+--- com.example:one:1.0.0",
    });

    expect(result.status).toBe("success");
    expect(result.newRoot?.name).toBe("root:root");
    expect(result.newRoot?.children[0].name).toBe("com.example:one");
    expect(result.mergedRoot?.id).toBe(result.activeTreeIndex?.ids[0]);
  });

  it("registers onmessage when worker hooks are available", async () => {
    const postMessage = vi.fn();
    const importScripts = vi.fn();
    workerScope.postMessage = postMessage as typeof workerScope.postMessage;
    workerScope.importScripts = importScripts;

    vi.resetModules();
    const module = await import("../../../src/lib/analysis/analysisWorker");
    expect(typeof workerScope.onmessage).toBe("function");

    const payload = { newText: "+--- com.example:two:1.0.0" };
    workerScope.onmessage?.({ data: payload } as MessageEvent);

    expect(postMessage).toHaveBeenCalledTimes(1);
    const messageArg = postMessage.mock.calls[0][0];
    expect(module.handleAnalysisWorkerRequest(payload)).toEqual(messageArg);
  });
});
