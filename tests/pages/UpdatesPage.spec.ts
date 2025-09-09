import { describe, it, expect } from "vitest";
import UpdatesPage from "../../src/pages/UpdatesPage.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import { state } from "../../src/lib/stores";
import { parseGradleTree, computeDiff, computeForcedUpdates, indexNodes, findNodeByPath } from "../../src/lib/logic";
import { domIdForNode } from "../../src/lib/utils";
import fs from "node:fs";
import path from "node:path";

function read(file: string) {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

describe("UpdatesPage", () => {
  it("lists forced updates and responds to Show all", async () => {
    const oldRoot = parseGradleTree(read("gradle-old.txt"));
    const newRoot = parseGradleTree(read("gradle-new.txt"));
    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const { nodeIndexByGA } = indexNodes(mergedRoot);
    const { forcedUpdates, gaToPaths } = computeForcedUpdates(mergedRoot);
    state.set({
      oldText: "",
      newText: "",
      oldRoot,
      newRoot,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set(),
      searchQuery: "",
      nodeIndexByGA,
      gaToPaths,
      forcedUpdates,
    } as any);

    const { getByLabelText, findAllByText } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });

    // By default only forced updates are shown; kotlin stdlib should be present (may appear multiple times in paths)
    const forcedKotlin = await findAllByText(/org\.jetbrains\.kotlin:kotlin-stdlib/);
    expect(forcedKotlin.length).toBeGreaterThan(0);

    // Toggle show all
    const cb = getByLabelText(
      "Show all dependencies (not only forced updates)",
    ) as HTMLInputElement;
    await fireEvent.click(cb);

    // Now a non-forced like androidx.core:core should also appear
    const coreMatches = await findAllByText(/androidx\.core:core/);
    expect(coreMatches.length).toBeGreaterThan(0);
  });

  it("Jump to Diff Tree expands the target path", async () => {
    const oldRoot = parseGradleTree(read("gradle-old.txt"));
    const newRoot = parseGradleTree(read("gradle-new.txt"));
    const { mergedRoot } = computeDiff(oldRoot, newRoot);
    const { nodeIndexByGA } = indexNodes(mergedRoot);
    const { forcedUpdates, gaToPaths } = computeForcedUpdates(mergedRoot);
    state.set({
      oldText: "",
      newText: "",
      oldRoot,
      newRoot,
      mergedRoot,
      diffAvailable: true,
      favorites: new Set(),
      searchQuery: "",
      nodeIndexByGA,
      gaToPaths,
      forcedUpdates,
    } as any);

    // Render Diff tree and Updates so the jump can find elements
    const DiffTreePage = (await import("../../src/pages/DiffTreePage.svelte")).default;
    render(DiffTreePage, { target: document.getElementById("app")! });
    const { container } = render(UpdatesPage, {
      target: document.getElementById("app")!,
    });

    // Open all path lists (so buttons are present)
    container.querySelectorAll("summary").forEach((s) => (s as HTMLElement).click());

    const btnEl = container.querySelector('details button.button.is-small.is-light') as HTMLButtonElement | null;
    expect(btnEl).toBeTruthy();
    const li = btnEl.closest("li")!;
    const pathText = (li.firstChild as Text).textContent!.trim();

    btnEl.click();
    await new Promise((r) => setTimeout(r, 150));

    const { node, ancestors } = findNodeByPath(mergedRoot, pathText);
    expect(node).toBeTruthy();
    ancestors.forEach((a) => {
      const row = document.querySelector(`[data-id="${a.id}"]`) as HTMLElement | null;
      expect(row).toBeTruthy();
      expect(row!.getAttribute("aria-expanded")).toBe("true");
    });
    const el = document.getElementById(domIdForNode({ id: node!.id }));
    expect(el).toBeTruthy();
  });
});
