import { describe, it, expect } from "vitest";
import DiffTreePage from "../../src/pages/DiffTreePage.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import { state } from "../../src/lib/stores";
import { parseGradleTree, computeDiff } from "../../src/lib/logic";
import fs from "node:fs";
import path from "node:path";

function read(file: string) {
  return fs.readFileSync(path.resolve("src/samples", file), "utf8");
}

async function setupPage() {
  const oldRoot = parseGradleTree(read("gradle-old.txt"));
  const newRoot = parseGradleTree(read("gradle-new.txt"));
  const { mergedRoot } = computeDiff(oldRoot, newRoot);
  state.update(() => ({
    oldText: "",
    newText: "",
    oldRoot,
    newRoot,
    mergedRoot,
    diffAvailable: true,
    favorites: new Set<string>(),
    searchQuery: "",
    nodeIndexByGA: new Map(),
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
  }));
  return render(DiffTreePage, { target: document.getElementById("app")! });
}

async function setupSinglePage() {
  const newRoot = parseGradleTree(read("gradle-new.txt"));
  state.update(() => ({
    oldText: "",
    newText: "",
    oldRoot: null,
    newRoot,
    mergedRoot: newRoot,
    diffAvailable: false,
    favorites: new Set<string>(),
    searchQuery: "",
    nodeIndexByGA: new Map(),
    gaToPaths: new Map(),
    forcedUpdates: new Map(),
  }));
  return render(DiffTreePage, { target: document.getElementById("app")! });
}

describe("DiffTreePage", () => {
  it("renders changed root koin and removed transitive", async () => {
    const { getByText, container } = await setupPage();
    // Look for the GA text
    expect(getByText("io.insert-koin:koin-androidx-compose")).toBeTruthy();
    // Verify presence of status tag somewhere
    expect(
      container.querySelector(".tag.is-warning, .tag.is-danger, .tag.is-success"),
    ).toBeTruthy();
  });

  it("Expand/Collapse and Removed/Changed filters behave as expected", async () => {
    const { getByText, getByLabelText, container } = await setupPage();

    // Expand all to reveal subtree
    await fireEvent.click(getByText("Expand All"));

    // Toggle Removed to focus removed children (androidx.compose.runtime, lifecycle-viewmodel-compose)
    const removedCb = getByLabelText("Removed") as HTMLInputElement;
    await fireEvent.click(removedCb);

    // Expect removed runtime to be visible
    expect(getByText("androidx.compose.runtime:runtime")).toBeTruthy();

    // Switch to Changed and ensure removed-runtime is no longer shown
    await fireEvent.click(removedCb); // off
    const changedCb = getByLabelText("Changed") as HTMLInputElement;
    await fireEvent.click(changedCb);

    // Now focus on changed: there should be no removed badges visible
    const removedBadges = container.querySelectorAll(".tag.is-danger");
    expect(removedBadges.length).toBe(0);
    expect(getByText("io.insert-koin:koin-compose")).toBeTruthy();

    // Collapse all should hide children
    await fireEvent.click(getByText("Collapse All"));
  });

  it("Favorites filter shows favorited subtree", async () => {
    const { getByLabelText, getByText } = await setupPage();
    // Mark koin as favorite via store
    state.toggleFavorite("io.insert-koin:koin-androidx-compose");

    const favCb = getByLabelText("Favorites") as HTMLInputElement;
    await fireEvent.click(favCb);

    expect(getByText("io.insert-koin:koin-androidx-compose")).toBeTruthy();
  });

  it("Favorites filter works without diff and status filters disabled", async () => {
    const { getByLabelText, getByText, queryByText } = await setupSinglePage();

    // Status filters should be disabled
    expect((getByLabelText("Added") as HTMLInputElement).disabled).toBe(true);
    expect((getByLabelText("Removed") as HTMLInputElement).disabled).toBe(true);
    expect((getByLabelText("Changed") as HTMLInputElement).disabled).toBe(true);
    expect((getByLabelText("Unchanged") as HTMLInputElement).disabled).toBe(true);

    // Favorites should remain enabled
    const favCb = getByLabelText("Favorites") as HTMLInputElement;
    expect(favCb.disabled).toBe(false);

    // Mark a top-level dependency as favorite and enable Favorites filter
    state.toggleFavorite("io.insert-koin:koin-androidx-compose");
    await fireEvent.click(favCb);

    // The favorite remains, unrelated siblings are filtered out
    expect(getByText("io.insert-koin:koin-androidx-compose")).toBeTruthy();
    expect(queryByText("androidx.core:core-ktx")).toBeFalsy();
  });

  it("Search limits to matching branches", async () => {
    const { getByText, queryByText } = await setupPage();
    // Expand for easier assertions
    await fireEvent.click(getByText("Expand All"));
    // Apply global search through store
    state.setSearchQuery("koin");
    await tick();

    expect(getByText("io.insert-koin:koin-androidx-compose")).toBeTruthy();
    expect(queryByText("androidx.core:core")).toBeFalsy();
  });
});
