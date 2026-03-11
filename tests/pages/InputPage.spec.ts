import { describe, it, expect } from "vitest";
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
});
