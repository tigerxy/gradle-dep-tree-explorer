import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";
import Footer from "../../src/components/Footer.svelte";

describe("Footer", () => {
  it("renders the current package metadata", () => {
    const { getByText, getByRole } = render(Footer, {
      target: document.getElementById("app")!,
    });

    expect(getByText(/Roland Greim/)).toBeTruthy();
    expect(getByText(/v1\.0\.1/)).toBeTruthy();

    const link = getByRole("link", { name: "GitHub" }) as HTMLAnchorElement;
    expect(link.href).toBe("https://github.com/tigerxy/gradle-dep-tree-explorer");
  });
});
