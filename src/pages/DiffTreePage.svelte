<script lang="ts">
  import { state, expanded } from "../lib/stores";
  import TreeNode from "../components/TreeNode.svelte";

  // Filters
  let filterAdded: boolean = false;
  let filterRemoved: boolean = false;
  let filterChanged: boolean = false;
  let filterUnchanged: boolean = false;
  let filterFavorites: boolean = false;

  // Status filters (added/removed/changed/unchanged) require an old tree
  $: statusFiltersEnabled = !!$state.oldRoot;
  // Enable filtering pipeline if either status filters are allowed or Favorites is on
  $: filtersEnabled = statusFiltersEnabled || filterFavorites;

  function expandAll(): void {
    if ($state.mergedRoot) expanded.expandAll($state.mergedRoot);
  }
  function collapseAll(): void {
    if ($state.mergedRoot) expanded.collapseAll($state.mergedRoot);
  }
  // Ensure checkboxes respond to click in test envs that don't emit 'change'
  function onAddedClick() {
    filterAdded = !filterAdded;
  }
  function onRemovedClick() {
    filterRemoved = !filterRemoved;
  }
  function onChangedClick() {
    filterChanged = !filterChanged;
  }
  function onUnchangedClick() {
    filterUnchanged = !filterUnchanged;
  }
  function onFavoritesClick() {
    filterFavorites = !filterFavorites;
  }
</script>

<h1 class="title">Diff Tree</h1>
<p class="subtitle">
  Collapsible dependency tree with status (added / removed / changed) when an old tree is provided.
</p>

<div class="box">
  <div class="columns is-vcentered is-mobile">
    <div class="column is-narrow"><strong>Filters:</strong></div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterAdded}
          on:click={onAddedClick}
          disabled={!statusFiltersEnabled}
        /> Added</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterRemoved}
          on:click={onRemovedClick}
          disabled={!statusFiltersEnabled}
        /> Removed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterChanged}
          on:click={onChangedClick}
          disabled={!statusFiltersEnabled}
        /> Changed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterUnchanged}
          on:click={onUnchangedClick}
          disabled={!statusFiltersEnabled}
        /> Unchanged</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input type="checkbox" bind:checked={filterFavorites} on:click={onFavoritesClick} /> Favorites</label
      >
    </div>
    <div class="column">
      <div class="buttons is-right">
        <button class="button is-light" on:click={expandAll}>Expand All</button>
        <button class="button is-light" on:click={collapseAll}>Collapse All</button>
      </div>
    </div>
  </div>
  <p class="help">
    {statusFiltersEnabled
      ? "Use filters to focus on specific change statuses."
      : "Only Favorites is available without an old tree."}
  </p>
</div>

<div id="diffTreeContainer" class="content">
  {#if !$state.mergedRoot}
    <p class="has-text-grey">Parse a current dependency tree on the Input page to see results.</p>
  {:else}
    <ul class="tree is-mono">
      <TreeNode
        node={$state.mergedRoot}
        {filtersEnabled}
        {filterAdded}
        {filterRemoved}
        {filterChanged}
        {filterUnchanged}
        {filterFavorites}
        searchQuery={$state.searchQuery}
      />
    </ul>
  {/if}
</div>
