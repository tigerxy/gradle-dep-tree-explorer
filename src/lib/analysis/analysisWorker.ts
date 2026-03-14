import { buildAnalysis, type BuildAnalysisInput } from "./buildAnalysis";
import { serializeAnalysisResult, type AnalysisResultDto } from "./workerPayloads";

export type AnalysisWorkerRequest = BuildAnalysisInput;

export interface AnalysisWorkerResponse {
  result: AnalysisResultDto;
}

export function handleAnalysisWorkerRequest(
  request: AnalysisWorkerRequest,
): AnalysisWorkerResponse {
  return {
    result: serializeAnalysisResult(buildAnalysis(request)),
  };
}

const workerScope = globalThis as typeof globalThis & {
  onmessage?: ((event: MessageEvent<AnalysisWorkerRequest>) => void) | null;
  postMessage?: (message: AnalysisWorkerResponse) => void;
  importScripts?: (...urls: string[]) => void;
};

if (
  typeof workerScope.postMessage === "function" &&
  typeof workerScope.importScripts === "function"
) {
  workerScope.onmessage = (event) => {
    workerScope.postMessage?.(handleAnalysisWorkerRequest(event.data));
  };
}
