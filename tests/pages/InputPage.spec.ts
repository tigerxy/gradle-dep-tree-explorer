import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InputPage from "../../src/pages/InputPage.svelte";
import type { AnalysisResult } from "../../src/lib/analysis/buildAnalysis";
import { state, route } from "../../src/lib/stores";
import { get } from "svelte/store";
import type { DiffNode } from "../../src/lib/types";

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  readAsText(): void {
    this.result = "+--- com.example:fromfile:1.0.0";
    this.onload?.({} as ProgressEvent<FileReader>);
  }
}

describe("InputPage", () => {
  beforeEach(() => {
    vi.stubGlobal("FileReader", MockFileReader as unknown as typeof FileReader);
    state.set({
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: null,
      mergedRoot: null,
      diffAvailable: false,
      favorites: new Set(),
      searchQuery: "",
      nodeIndexByGA: new Map(),
      activeTreeIndex: null,
      gaToPaths: new Map(),
      forcedUpdates: new Map(),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: null,
      analysisIssues: [],
    });
    route.set("input");
  });

  it("loads samples, uploads files, and builds the views", async () => {
    const { getByLabelText, getByPlaceholderText, getByRole, container } = render(InputPage, {
      target: document.getElementById("app")!,
    });

    await fireEvent.click(getByLabelText("Load example old tree"));
    await fireEvent.click(getByLabelText("Load example current tree"));
    expect(
      (getByPlaceholderText("Paste old dependency tree here…") as HTMLTextAreaElement).value,
    ).not.toBe("");
    expect(
      (getByPlaceholderText("Paste current dependency tree here…") as HTMLTextAreaElement).value,
    ).not.toBe("");

    const inputs = container.querySelectorAll('input[type="file"]');
    const oldUpload = inputs[0] as HTMLInputElement;
    const newUpload = inputs[1] as HTMLInputElement;
    const file = new File(["demo"], "demo.txt", { type: "text/plain" });
    await fireEvent.change(oldUpload, { target: { files: [file] } });
    await fireEvent.change(newUpload, { target: { files: [file] } });

    const mergedRoot = { id: "root", children: [] } as unknown as DiffNode;
    const successResult: AnalysisResult = {
      status: "success",
      issues: [],
      oldRoot: null,
      newRoot: null,
      mergedRoot,
      diffAvailable: false,
      nodeIndexByGA: new Map(),
      activeTreeIndex: null,
      gaToPaths: new Map(),
      forcedUpdates: new Map(),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
    };
    vi.spyOn(state, "parseAndBuild").mockReturnValue(successResult);

    const button = getByRole("button", { name: /Parse & Build Views/ });
    await fireEvent.click(button);

    expect(get(route)).toBe("diff");
  });

  it("clears inputs when clear buttons are used", async () => {
    const { getByLabelText, getByPlaceholderText } = render(InputPage, {
      target: document.getElementById("app")!,
    });

    const oldArea = getByPlaceholderText("Paste old dependency tree here…") as HTMLTextAreaElement;
    const newArea = getByPlaceholderText(
      "Paste current dependency tree here…",
    ) as HTMLTextAreaElement;
    oldArea.value = "old";
    newArea.value = "new";
    await fireEvent.input(oldArea);
    await fireEvent.input(newArea);

    await fireEvent.click(getByLabelText("Clear old input"));
    await fireEvent.click(getByLabelText("Clear new input"));

    expect(oldArea.value).toBe("");
    expect(newArea.value).toBe("");
  });

  it("keeps route on error parse result", async () => {
    const { getByRole } = render(InputPage, { target: document.getElementById("app")! });
    const errorResult = {
      status: "error",
    } as AnalysisResult;
    vi.spyOn(state, "parseAndBuild").mockReturnValue(errorResult);

    await fireEvent.click(getByRole("button", { name: /Parse & Build Views/ }));
    expect(get(route)).toBe("input");
  });

  it("ignores file change when no file is provided", async () => {
    const { container, getByPlaceholderText } = render(InputPage, {
      target: document.getElementById("app")!,
    });
    const oldArea = getByPlaceholderText("Paste old dependency tree here…") as HTMLTextAreaElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await fireEvent.change(input, { target: { files: null } });
    expect(oldArea.value).toBe("");
  });
});
