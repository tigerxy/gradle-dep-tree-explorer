<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import { state as appState, expanded } from "../lib/stores";
  import FiltersPanel from "../components/FiltersPanel.svelte";
  import { createDiffTreePageModel } from "../lib/pages/diffTreePageModel";
  import TreeNode from "../components/TreeNode.svelte";

  // Filters
  let filterAdded: boolean = false;
  let filterRemoved: boolean = false;
  let filterChanged: boolean = false;
  let filterUnchanged: boolean = false;
  let filterFavorites: boolean = false;

  const shouldApplySearchExpansion = (() => {
    let lastAppliedSearchKey = "";

    return (searchKey: string): boolean => {
      if (searchKey === lastAppliedSearchKey) return false;

      lastAppliedSearchKey = searchKey;
      return searchKey.length > 0;
    };
  })();

  // Status filters (added/removed/changed/unchanged) require an old tree
  $: page = createDiffTreePageModel({
    root: $appState.mergedRoot,
    oldRootAvailable: !!$appState.oldRoot,
    searchQuery: $appState.searchQuery,
    favorites: $appState.favorites,
    treeIndex: $appState.activeTreeIndex ?? null,
    filters: {
      added: filterAdded,
      removed: filterRemoved,
      changed: filterChanged,
      unchanged: filterUnchanged,
      favorites: filterFavorites,
    },
  });

  $: if (
    shouldApplySearchExpansion(
      page.search.isActive ? `${page.search.query}|${page.visibleNodeIndexes.join(",")}` : "",
    )
  ) {
    const nextExpanded = new SvelteSet<string>($expanded);

    for (const id of page.visibleNodeIds) {
      nextExpanded.add(id);
    }

    expanded.set(nextExpanded);
  }

  function expandAll(): void {
    if (page.listing.root) expanded.expandAll(page.listing.root);
  }
  function collapseAll(): void {
    if (page.listing.root) expanded.collapseAll(page.listing.root);
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

<FiltersPanel
  helpText={page.statusFiltersEnabled
    ? "Use filters to focus on specific change statuses."
    : "Only Favorites is available without an old tree."}
>
  <div slot="filters" class="columns is-vcentered is-mobile is-gapless">
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterAdded}
          on:click={onAddedClick}
          disabled={!page.filters.added.available}
        /> Added</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterRemoved}
          on:click={onRemovedClick}
          disabled={!page.filters.removed.available}
        /> Removed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterChanged}
          on:click={onChangedClick}
          disabled={!page.filters.changed.available}
        /> Changed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          bind:checked={filterUnchanged}
          on:click={onUnchangedClick}
          disabled={!page.filters.unchanged.available}
        /> Unchanged</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input type="checkbox" bind:checked={filterFavorites} on:click={onFavoritesClick} />
        Favorites</label
      >
    </div>
  </div>
  <div slot="actions">
    <button class="button is-light" on:click={expandAll}>Expand All</button>
    <button class="button is-light" on:click={collapseAll}>Collapse All</button>
  </div>
</FiltersPanel>

<div id="diffTreeContainer" class="content">
  {#if !page.listing.root}
    <p class="has-text-grey">Parse a current dependency tree on the Input page to see results.</p>
  {:else}
    <ul class="tree is-mono">
      <TreeNode node={page.listing.root} {page} />
    </ul>
  {/if}
</div>
