import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, beforeEach } from "vitest";
import Navbar from "../../src/components/Navbar.svelte";
import { route, state } from "../../src/lib/stores";
import { get } from "svelte/store";

describe("Navbar", () => {
  beforeEach(() => {
    state.setSearchQuery("");
    route.set("input");
    location.hash = "";
  });

  it("toggles burger and navigates", async () => {
    const { getByText, getByRole } = render(Navbar, { target: document.getElementById("app")! });
    const burger = getByRole("button", { name: "menu" });
    await fireEvent.click(burger);
    expect(burger.getAttribute("aria-expanded")).toBe("true");

    await fireEvent.click(getByText("Diff Tree"));
    expect(get(route)).toBe("diff");

    await fireEvent.click(getByText("Updates"));
    expect(get(route)).toBe("updates");

    await fireEvent.click(getByText("Input"));
    expect(get(route)).toBe("input");

    await fireEvent.click(getByText("Graph"));
    expect(get(route)).toBe("graph");
  });

  it("initializes, clears, and submits search from input element", async () => {
    state.setSearchQuery(" seeded ");

    const { getByLabelText, getByTitle, container, getByText } = render(Navbar, {
      target: document.getElementById("app")!,
    });

    const input = container.querySelector("#searchInput") as HTMLInputElement;
    expect(input.value).toBe("seeded");

    await fireEvent.input(input, { target: { value: "abc" } });
    await fireEvent.keyDown(input, { key: "Escape" });
    expect(get(state).searchQuery).toBe("seeded");

    await fireEvent.keyDown(input, { key: "Enter" });
    expect(get(state).searchQuery).toBe("abc");

    await fireEvent.click(getByLabelText("clear"));
    expect(get(state).searchQuery).toBe("");
    expect(input.value).toBe("");

    await fireEvent.click(getByTitle("Go"));
    expect(get(state).searchQuery).toBe("");

    await fireEvent.click(getByText("Gradle Dep Tree Explorer"));
    expect(get(route)).toBe("input");
  });
});
