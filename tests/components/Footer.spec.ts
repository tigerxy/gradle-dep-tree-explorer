import { render } from "@testing-library/svelte";
import { describe, it, expect } from "vitest";

const realPkgPath = "../../package.json";

describe("Footer", () => {
  it("renders author and repo URL from package metadata object form", async () => {
    const Footer = (await import("../../src/components/Footer.svelte")).default;
    const { getByText, getByRole } = render(Footer, { target: document.getElementById("app")! });

    expect(getByText(/Roland Greim/)).toBeTruthy();
    const link = getByRole("link", { name: "GitHub" }) as HTMLAnchorElement;
    expect(link.href).toBe("https://github.com/tigerxy/gradle-dep-tree-explorer");
  });

  it("trims git+ prefixes and .git suffixes for repository strings", async () => {
    const pkgModule = (await import(realPkgPath)) as {
      default: {
        version?: string;
        author?: string | { name?: string };
        repository?: string | { url?: string };
      };
    };
    const pkg = pkgModule.default;
    const original = { ...pkg };
    pkg.repository = "git+https://example.com/repo.git";
    pkg.author = "Example Author";
    pkg.version = "2.0.0";

    const Footer = (await import("../../src/components/Footer.svelte")).default;
    const { getByText } = render(Footer, { target: document.getElementById("app")! });

    const link = getByText("GitHub") as HTMLAnchorElement;
    expect(link.href).toBe("https://example.com/repo");
    expect(getByText(/Example Author/)).toBeTruthy();
    expect(getByText(/v2.0.0/)).toBeTruthy();

    Object.assign(pkg, original);
  });
});
