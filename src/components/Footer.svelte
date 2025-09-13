<script lang="ts">
  // Import metadata from package.json (tsconfig resolves JSON modules)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import pkg from "../../package.json";

  type RepoField = string | { url?: string };
  interface PkgMeta {
    version?: string;
    author?: string | { name?: string };
    repository?: RepoField;
    homepage?: string;
  }

  const meta = pkg as unknown as PkgMeta;
  const version: string = String(meta.version || "0.0.0");
  const year: number = new Date().getFullYear();
  const author: string = typeof meta.author === "string" ? meta.author : meta.author?.name || "";
  const repoRaw: string =
    typeof meta.repository === "string" ? meta.repository : meta.repository?.url || "";
  const repoUrl: string = repoRaw.replace(/^git\+/, "").replace(/\.git$/, "");
</script>

<footer class="footer has-text-centered">
  <div class="content is-small">
    <p>
      © {year}
      {author || ""}
      · <a href={repoUrl} target="_blank" rel="noopener">GitHub</a>
      · v{version}
    </p>
  </div>
</footer>
