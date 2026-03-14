<script lang="ts">
  import { state as appState } from "../lib/stores";
  import { buildAnalysisIssuesHtml, createAnalysisIssuesModel } from "./analysisIssuesModel";

  $: model = createAnalysisIssuesModel($appState.analysisStatus, $appState.analysisIssues);
  $: itemsHtml = buildAnalysisIssuesHtml(model?.items ?? []);
</script>

<article class={"message " + (model?.messageClass ?? "is-info")} hidden={!model}>
  <div class="message-header">
    <p>{model?.title ?? ""}</p>
  </div>
  <div class="message-body">
    <ul class="analysis-issues">
      {@html itemsHtml}
    </ul>
  </div>
</article>
