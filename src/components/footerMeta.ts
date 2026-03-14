type RepoField = string | { url?: string };

export interface FooterPkgMeta {
  version?: string;
  author?: string | { name?: string };
  repository?: RepoField;
  homepage?: string;
}

export interface FooterMeta {
  version: string;
  author: string;
  repoUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function deriveFooterMeta(meta: FooterPkgMeta): FooterMeta {
  const author = typeof meta.author === "string" ? meta.author : meta.author?.name || "";
  const repoRaw =
    typeof meta.repository === "string" ? meta.repository : meta.repository?.url || "";

  return {
    version: String(meta.version || "0.0.0"),
    author,
    repoUrl: repoRaw.replace(/^git\+/, "").replace(/\.git$/, ""),
  };
}

export function buildFooterHtml(meta: FooterMeta, year: number): string {
  return [
    `&copy; ${year} ${escapeHtml(meta.author)}`,
    `<a href="${escapeHtml(meta.repoUrl)}" target="_blank" rel="noopener">GitHub</a>`,
    `v${escapeHtml(meta.version)}`,
  ].join(" &middot; ");
}
