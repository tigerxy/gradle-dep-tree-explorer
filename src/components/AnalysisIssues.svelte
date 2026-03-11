<script lang="ts">
  import { state as appState } from "../lib/stores";

  function issueLabel(source: "old" | "new" | "validation"): string {
    if (source === "old") return "Old tree";
    if (source === "new") return "Current tree";
    return "Validation";
  }

  function messageClass(status: string | null): string {
    if (status === "error") return "is-danger";
    if (status === "success-with-warnings") return "is-warning";
    return "is-info";
  }
</script>

{#if $appState.analysisStatus === "error" || $appState.analysisStatus === "success-with-warnings"}
  <article class={"message " + messageClass($appState.analysisStatus)}>
    <div class="message-header">
      <p>
        {$appState.analysisStatus === "error" ? "Analysis blocked" : "Analysis warnings"}
      </p>
    </div>
    <div class="message-body">
      <ul class="analysis-issues">
        {#each $appState.analysisIssues as issue, index (`${issue.source}-${issue.code}-${issue.line ?? 0}-${index}`)}
          <li>
            <strong>{issueLabel(issue.source)}</strong>: {issue.message}
            {#if issue.line}
              <span> (line {issue.line})</span>
            {/if}
            {#if issue.raw}
              <pre class="analysis-issue-raw is-mono">{issue.raw}</pre>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  </article>
{/if}
