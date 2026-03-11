import { describe, expect, it } from "vitest";
import { render } from "@testing-library/svelte";
import Footer from "../../src/components/Footer.svelte";

describe("Footer", () => {
  it("renders project metadata and a normalized repository link", () => {
    const { container } = render(Footer, { target: document.getElementById("app")! });

    expect(container.textContent).toContain("Roland Greim");
    expect(container.textContent).toContain("v1.0.1");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://github.com/tigerxy/gradle-dep-tree-explorer",
    );
  });
});
