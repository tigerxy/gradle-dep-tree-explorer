import { beforeEach, describe, it, expect, vi } from "vitest";
import { tick } from "svelte";
import InputPage from "../../src/pages/InputPage.svelte";
import App from "../../src/App.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import { route, state } from "../../src/lib/stores";

function textarea(container: HTMLElement, placeholder: string): HTMLTextAreaElement {
  const el = container.querySelector(
    `textarea[placeholder="${placeholder}"]`,
  ) as HTMLTextAreaElement;
  if (!el) throw new Error("textarea not found");
  return el;
}

describe("InputPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses input and navigates to diff", async () => {
    const { container, getByText } = render(InputPage, { target: document.getElementById("app")! });

    const newArea = textarea(container, "Paste current dependency tree here…");
    await fireEvent.input(newArea, {
      target: {
        value:
          "releaseRuntimeClasspath - Resolved configuration for runtime for variant: release\n+--- org.jetbrains.kotlin:kotlin-stdlib:2.0.21",
      },
    });

    const btn = getByText("Parse & Build Views");
    await fireEvent.click(btn);

    expect(state).toBeTruthy();
    // mergedRoot is filled after parse
    let mergedRoot: unknown;
    state.subscribe((s) => (mergedRoot = s.mergedRoot))();
    expect(mergedRoot).toBeTruthy();
  });

  it("shows a structured validation error instead of using alert", async () => {
    const { getByText, queryByText } = render(App, { target: document.getElementById("app")! });

    await fireEvent.click(getByText("Parse & Build Views"));
    await tick();

    let currentRoute: unknown;
    route.subscribe((value) => (currentRoute = value))();

    expect(currentRoute).toBe("input");
    expect(getByText("Analysis blocked")).toBeTruthy();
    expect(queryByText("Please provide a current dependency tree (right textarea).")).toBeFalsy();
  });

  it("shows parser warnings in the UI and still navigates to diff when partial results are usable", async () => {
    const { container, getByText } = render(App, { target: document.getElementById("app")! });

    const oldArea = textarea(container, "Paste old dependency tree here…");
    const newArea = textarea(container, "Paste current dependency tree here…");

    await fireEvent.input(oldArea, { target: { value: "+--- broken" } });
    await fireEvent.input(newArea, {
      target: {
        value:
          "releaseRuntimeClasspath - Resolved configuration for runtime for variant: release\n|         +--- com.example:child:2.0.0",
      },
    });

    await fireEvent.click(getByText("Parse & Build Views"));
    await tick();

    let currentRoute: unknown;
    route.subscribe((value) => (currentRoute = value))();

    expect(currentRoute).toBe("diff");
    expect(getByText("Analysis warnings")).toBeTruthy();
    expect(getByText(/The old dependency tree could not be parsed/)).toBeTruthy();
    expect(getByText(/Dependency depth skipped levels/)).toBeTruthy();
  });

  it("clear buttons empty the corresponding textareas", async () => {
    const { container, getAllByLabelText } = render(InputPage, {
      target: document.getElementById("app")!,
    });

    const oldArea = textarea(container, "Paste old dependency tree here…");
    const newArea = textarea(container, "Paste current dependency tree here…");

    await fireEvent.input(oldArea, { target: { value: "old content" } });
    await fireEvent.input(newArea, { target: { value: "new content" } });

    expect(oldArea.value).toBe("old content");
    expect(newArea.value).toBe("new content");

    const clearOld = getAllByLabelText("Clear old input");
    const clearNew = getAllByLabelText("Clear new input");
    // First button clears old, second clears current in the current UI
    await fireEvent.click(clearOld[0]);
    await fireEvent.click(clearNew[0]);

    expect(oldArea.value).toBe("");
    expect(newArea.value).toBe("");
  });

  it("loads bundled sample trees into the textareas", async () => {
    const { container, getByLabelText } = render(InputPage, {
      target: document.getElementById("app")!,
    });

    await fireEvent.click(getByLabelText("Load example old tree"));
    await fireEvent.click(getByLabelText("Load example current tree"));

    expect(textarea(container, "Paste old dependency tree here…").value).toContain(
      "io.insert-koin:koin-androidx-compose",
    );
    expect(textarea(container, "Paste current dependency tree here…").value).toContain(
      "io.insert-koin:koin-androidx-compose",
    );
  });

  it("reads uploaded old and current tree files", async () => {
    class MockFileReader {
      static nextResult = "";
      result: string | null = null;
      onload: null | (() => void) = null;

      readAsText() {
        this.result = MockFileReader.nextResult;
        this.onload?.();
      }
    }

    vi.stubGlobal("FileReader", MockFileReader);

    const { container } = render(InputPage, { target: document.getElementById("app")! });
    const fileInputs = container.querySelectorAll('input[type="file"]');
    const oldInput = fileInputs[0] as HTMLInputElement;
    const newInput = fileInputs[1] as HTMLInputElement;
    const oldFile = new File(["old"], "old.txt", { type: "text/plain" });
    const newFile = new File(["new"], "new.txt", { type: "text/plain" });

    Object.defineProperty(oldInput, "files", { configurable: true, value: [oldFile] });
    Object.defineProperty(newInput, "files", { configurable: true, value: [newFile] });

    MockFileReader.nextResult = "old file tree";
    await fireEvent.change(oldInput);

    MockFileReader.nextResult = "new file tree";
    await fireEvent.change(newInput);

    expect(textarea(container, "Paste old dependency tree here…").value).toBe("old file tree");
    expect(textarea(container, "Paste current dependency tree here…").value).toBe("new file tree");
  });
});
