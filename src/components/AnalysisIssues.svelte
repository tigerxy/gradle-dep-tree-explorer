<script lang="ts">
  import type { AnalysisIssue, AnalysisStatus } from "../lib/types";
  import { state as appState } from "../lib/stores";
  import { createAnalysisIssuesModel } from "./analysisIssuesModel";

  let dismissed = false;
  const hasAnalysisChanged = (() => {
    let lastStatus: AnalysisStatus | null = null;
    let lastIssues: AnalysisIssue[] | null = null;

    return (status: AnalysisStatus | null, issues: AnalysisIssue[]) => {
      const changed = status !== lastStatus || issues !== lastIssues;
      lastStatus = status;
      lastIssues = issues;
      return changed;
    };
  })();

  $: if (hasAnalysisChanged($appState.analysisStatus, $appState.analysisIssues)) {
    dismissed = false;
  }

  $: model = createAnalysisIssuesModel($appState.analysisStatus, $appState.analysisIssues);
</script>

{#if model && !dismissed}
  <article class={"message " + model.messageClass}>
    <div class="message-header">
      <p>{model.title}</p>
      <button
        type="button"
        class="delete"
        aria-label="Close analysis issues"
        on:click={() => {
          dismissed = true;
        }}
      ></button>
    </div>
    <div class="message-body">
      <ul class="analysis-issues">
        {#each model.items as item (item.key)}
          <li>
            <strong>{item.label}</strong>: {item.message}{item.lineText}
            {#if item.rawText}
              <pre class="analysis-issue-raw is-mono">{item.rawText}</pre>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </article>
{/if}
