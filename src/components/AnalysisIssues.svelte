<script lang="ts">
  import { state as appState } from "../lib/stores";
  import { createAnalysisIssuesModel } from "./analysisIssuesModel";

  $: model = createAnalysisIssuesModel($appState.analysisStatus, $appState.analysisIssues);
</script>

<article class={"message " + (model?.messageClass ?? "is-info")} hidden={!model}>
  <div class="message-header">
    <p>{model?.title ?? ""}</p>
  </div>
  <div class="message-body">
    <ul class="analysis-issues">
      {#if model}
        {#each model.items as item (item.key)}
          <li>
            <strong>{item.label}</strong>: {item.message}{item.lineText}
            {#if item.rawText}
              <pre class="analysis-issue-raw is-mono">{item.rawText}</pre>
            {/if}
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</article>
