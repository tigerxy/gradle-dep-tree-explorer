<script lang="ts">
  // Import metadata from package.json (tsconfig resolves JSON modules)
  // @ts-ignore
  import pkg from "../../package.json";
  import { deriveFooterMeta, type FooterPkgMeta } from "./footerMeta";

  const meta = deriveFooterMeta(pkg as FooterPkgMeta);
  const year: number = new Date().getFullYear();
  const footerPrefix: string = `© ${year} ${meta.author}`;
  const footerSuffix: string = `v${meta.version}`;
</script>

<footer class="footer has-text-centered">
  <div class="content is-small">
    <p>
      {footerPrefix} · <a href={meta.repoUrl} target="_blank" rel="noopener">GitHub</a> · {footerSuffix}
    </p>
  </div>
</footer>
