<script lang="ts">
  import { state as appState, graphHideNonMatches } from "../lib/stores";
  import { createMemoizedGraphModelBuilder } from "../lib/graph/buildGraphModel";
  import { renderGraph, type GraphRenderer } from "../lib/graph/renderGraph";
  import { domIdForNode } from "../lib/utils";

  let svgEl: SVGSVGElement | null = null;
  const buildGraphModel = createMemoizedGraphModelBuilder();
  let graphRenderer: GraphRenderer = {
    fit() {},
    resetZoom() {},
  };

  $: graphModel = buildGraphModel({
    root: $appState.mergedRoot,
    searchQuery: $appState.searchQuery,
    hideNonMatches: $graphHideNonMatches,
    treeIndex: $appState.activeTreeIndex,
    favorites: $appState.favorites,
  });

  function handleNodeClick(nodeId: string) {
    const targetId = domIdForNode({ id: nodeId });
    location.hash = "#diff";
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("blink");
        setTimeout(() => el.classList.remove("blink"), 1200);
      }
    }, 60);
  }

  function resetZoom() {
    graphRenderer.resetZoom();
  }

  function fit() {
    graphRenderer.fit();
  }

  $: if (svgEl) {
    graphRenderer = renderGraph({
      svgEl,
      model: graphModel,
      isDark: document.body.classList.contains("dark"),
      onNodeClick: handleNodeClick,
    });
  }
</script>

<h1 class="title">Graph</h1>
<p class="subtitle">
  Interactive tree visualization. Use the global search. Toggle “Hide non-matches (Graph)” to focus.
</p>

<div class="navbar-item">
  <div class="field">
    <input
      id="hideNonMatchesGraph"
      type="checkbox"
      class="switch is-rounded"
      bind:checked={$graphHideNonMatches}
    />
    <label for="hideNonMatchesGraph">Hide non-matches (Graph)</label>
  </div>
</div>

<div class="buttons">
  <button class="button is-light" on:click={fit}>Fit</button>
  <button class="button is-light" on:click={resetZoom}>Reset zoom</button>
</div>

<div id="graphContainer" class="box">
  <svg
    bind:this={svgEl}
    id="graphSvg"
    width="640"
    height="480"
    style="width: 100%; height: 100%;"
    role="img"
    aria-label="Dependency graph"
  ></svg>
</div>
