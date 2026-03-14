<script lang="ts">
  import FiltersPanel from "../components/FiltersPanel.svelte";
  import { state as appState, sharedDiffFilters } from "../lib/stores";
  import { createMemoizedGraphModelBuilder } from "../lib/graph/buildGraphModel";
  import type { SharedDiffFilterId } from "../lib/pages/sharedDiffFilters";
  import { renderGraph, type GraphRenderer } from "../lib/graph/renderGraph";
  import { jumpToDiffNode } from "./graphPageNavigation";

  let svgEl: SVGSVGElement | null = null;
  const buildGraphModel = createMemoizedGraphModelBuilder();
  let graphRenderer: GraphRenderer | null = null;
  $: statusFiltersEnabled = !!$appState.oldRoot;

  $: graphModel = buildGraphModel({
    root: $appState.mergedRoot,
    searchQuery: $appState.searchQuery,
    oldRootAvailable: !!$appState.oldRoot,
    treeIndex: $appState.activeTreeIndex,
    favorites: $appState.favorites,
    filters: $sharedDiffFilters,
  });

  $: if (svgEl) {
    graphRenderer = renderGraph({
      svgEl,
      model: graphModel,
      isDark: document.body.classList.contains("dark"),
      onNodeClick: jumpToDiffNode,
    });
  }

  function toggleFilter(id: SharedDiffFilterId): void {
    sharedDiffFilters.setFilter(id, !$sharedDiffFilters[id]);
  }
</script>

<h1 class="title">Graph</h1>
<p class="subtitle">
  Interactive tree visualization. Search and filters always control the visible graph.
</p>

<FiltersPanel
  helpText={statusFiltersEnabled
    ? "Use filters to focus on specific change statuses."
    : "Only Favorites is available without an old tree."}
>
  <div slot="filters">
    <div class="columns is-vcentered is-mobile is-gapless">
      <div class="column is-narrow">
        <label class="checkbox"
          ><input
            type="checkbox"
            checked={$sharedDiffFilters.added}
            on:click={() => toggleFilter("added")}
            disabled={!statusFiltersEnabled}
          /> Added</label
        >
      </div>
      <div class="column is-narrow">
        <label class="checkbox"
          ><input
            type="checkbox"
            checked={$sharedDiffFilters.removed}
            on:click={() => toggleFilter("removed")}
            disabled={!statusFiltersEnabled}
          /> Removed</label
        >
      </div>
      <div class="column is-narrow">
        <label class="checkbox"
          ><input
            type="checkbox"
            checked={$sharedDiffFilters.changed}
            on:click={() => toggleFilter("changed")}
            disabled={!statusFiltersEnabled}
          /> Changed</label
        >
      </div>
      <div class="column is-narrow">
        <label class="checkbox"
          ><input
            type="checkbox"
            checked={$sharedDiffFilters.unchanged}
            on:click={() => toggleFilter("unchanged")}
            disabled={!statusFiltersEnabled}
          /> Unchanged</label
        >
      </div>
      <div class="column is-narrow">
        <label class="checkbox"
          ><input
            type="checkbox"
            checked={$sharedDiffFilters.favorites}
            on:click={() => toggleFilter("favorites")}
          /> Favorites</label
        >
      </div>
    </div>
  </div>
  <div slot="actions">
    <button class="button is-light" on:click={() => graphRenderer?.fit()}>Fit</button>
    <button class="button is-light" on:click={() => graphRenderer?.resetZoom()}>Reset Zoom</button>
  </div>
</FiltersPanel>

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
