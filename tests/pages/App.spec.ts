import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import App from "../../src/App.svelte";
import { route } from "../../src/lib/stores";
import { get } from "svelte/store";

describe("App routing", () => {
  it("defaults to input when the hash is empty", () => {
    location.hash = "";
    render(App, { target: document.getElementById("app")! });
    expect(get(route)).toBe("input");
  });

  it("falls back to input on unknown hash", () => {
    location.hash = "#unknown";
    render(App, { target: document.getElementById("app")! });
    expect(get(route)).toBe("input");
  });

  it("activates graph page hash", () => {
    location.hash = "#graph";
    render(App, { target: document.getElementById("app")! });
    expect(get(route)).toBe("graph");
  });

  it("activates diff page hash", () => {
    location.hash = "#diff";
    render(App, { target: document.getElementById("app")! });
    expect(get(route)).toBe("diff");
  });
});
