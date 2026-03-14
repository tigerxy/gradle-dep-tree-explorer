import { describe, it, expect } from "vitest";
import { buildFooterHtml, deriveFooterMeta } from "../../src/components/footerMeta";

describe("deriveFooterMeta", () => {
  it("supports string author and repository values", () => {
    expect(
      deriveFooterMeta({
        version: "2.0.0",
        author: "Example Author",
        repository: "git+https://example.com/repo.git",
      }),
    ).toEqual({
      version: "2.0.0",
      author: "Example Author",
      repoUrl: "https://example.com/repo",
    });
  });

  it("supports object author and repository values", () => {
    expect(
      deriveFooterMeta({
        author: { name: "Obj Author" },
        repository: { url: "https://example.com/object.git" },
      }),
    ).toEqual({
      version: "0.0.0",
      author: "Obj Author",
      repoUrl: "https://example.com/object",
    });
  });

  it("falls back to empty author and repo", () => {
    expect(deriveFooterMeta({})).toEqual({
      version: "0.0.0",
      author: "",
      repoUrl: "",
    });
  });

  it("builds escaped footer html", () => {
    expect(
      buildFooterHtml(
        {
          version: `1.0.0"`,
          author: "<Author>",
          repoUrl: "https://example.com/?q=1&x=2",
        },
        2026,
      ),
    ).toBe(
      '&copy; 2026 &lt;Author&gt; &middot; <a href="https://example.com/?q=1&amp;x=2" target="_blank" rel="noopener">GitHub</a> &middot; v1.0.0&quot;',
    );
  });
});
