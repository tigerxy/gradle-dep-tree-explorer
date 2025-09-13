import { describe, it, expect } from "vitest";
import Navbar from "../../src/components/Navbar.svelte";
import { render, fireEvent } from "@testing-library/svelte";
import { state, route } from "../../src/lib/stores";
import { tick } from "svelte";
import { get } from "svelte/store";

function getSearch(): string {
  return get(state).searchQuery;
}

describe("Navbar search behavior", () => {
  it("does not update search on input until Enter is pressed", async () => {
    state.setSearchQuery("");
    const { getByPlaceholderText } = render(Navbar, { target: document.getElementById("app")! });
    const input = getByPlaceholderText("Search... (regex)") as HTMLInputElement;

    input.value = "koin";
    await fireEvent.input(input);
    await tick();
    expect(input.value).toBe("koin");
    expect(getSearch()).toBe("");

    await fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await tick();
    expect(getSearch()).toBe("koin");
  });

  it("Go button triggers search, × clears input and store", async () => {
    state.setSearchQuery("");
    const { getByPlaceholderText, getByTitle } = render(Navbar, {
      target: document.getElementById("app")!,
    });
    const input = getByPlaceholderText("Search... (regex)") as HTMLInputElement;
    const goBtn = getByTitle("Go");
    const clearBtn = getByTitle("Clear search");

    // Type text
    input.value = "android";
    await fireEvent.input(input);
    await tick();
    expect(getSearch()).toBe("");

    // Click Go
    await fireEvent.click(goBtn);
    await tick();
    expect(getSearch()).toBe("android");

    // Click × to clear
    await fireEvent.click(clearBtn);
    await tick();
    expect(input.value).toBe("");
    expect(getSearch()).toBe("");

    // Type again and ensure Go works with trimmed values
    input.value = "  core  ";
    await fireEvent.input(input);
    await tick();
    await fireEvent.click(goBtn);
    await tick();
    expect(getSearch()).toBe("core");
  });
});

describe("Navbar active item highlight", () => {
  it("highlights current page and updates on click", async () => {
    route.set("input");
    const { getByText } = render(Navbar, { target: document.getElementById("app")! });

    const inputLink = getByText("Input").closest("a") as HTMLAnchorElement;
    const diffLink = getByText("Diff Tree").closest("a") as HTMLAnchorElement;
    const updatesLink = getByText("Updates").closest("a") as HTMLAnchorElement;
    const graphLink = getByText("Graph").closest("a") as HTMLAnchorElement;

    expect(inputLink.classList.contains("is-active")).toBe(true);
    expect(diffLink.classList.contains("is-active")).toBe(false);
    expect(updatesLink.classList.contains("is-active")).toBe(false);
    expect(graphLink.classList.contains("is-active")).toBe(false);

    await fireEvent.click(graphLink);
    expect(graphLink.classList.contains("is-active")).toBe(true);
    expect(inputLink.classList.contains("is-active")).toBe(false);

    await fireEvent.click(diffLink);
    expect(diffLink.classList.contains("is-active")).toBe(true);
    expect(graphLink.classList.contains("is-active")).toBe(false);
  });
});
