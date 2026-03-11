import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import App from "../src/App.svelte";
import { route, state } from "../src/lib/stores";

describe("App", () => {
  beforeEach(() => {
    state.update((s) => ({
      ...s,
      oldText: "",
      newText: "",
      oldRoot: null,
      newRoot: null,
      mergedRoot: null,
      diffAvailable: false,
      favorites: new Set<string>(),
      searchQuery: "",
      nodeIndexByGA: new Map(),
      gaToPaths: new Map(),
      forcedUpdates: new Map(),
      parentIdsById: new Map(),
      oldParseDiagnostics: [],
      newParseDiagnostics: [],
      analysisStatus: null,
      analysisIssues: [],
    }));
    route.set("input");
    document.body.classList.remove("has-navbar-fixed-top");
  });

  it("syncs the route from the hash and falls back to input for invalid hashes", async () => {
    location.hash = "#updates";
    const { container } = render(App, { target: document.getElementById("app")! });
    await tick();

    expect(document.body.classList.contains("has-navbar-fixed-top")).toBe(true);
    expect(container.querySelector(".page.is-active")?.textContent).toContain("Updates");

    location.hash = "#graph";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await tick();
    expect(container.querySelector(".page.is-active")?.textContent).toContain("Graph");

    location.hash = "#unknown";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await tick();
    expect(container.querySelector(".page.is-active")?.textContent).toContain("Input");
  });
});
