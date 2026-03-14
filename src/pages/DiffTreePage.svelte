<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import { state as appState, expanded, sharedDiffFilters } from "../lib/stores";
  import FiltersPanel from "../components/FiltersPanel.svelte";
  import { createDiffTreePageModel } from "../lib/pages/diffTreePageModel";
  import type { SharedDiffFilterId } from "../lib/pages/sharedDiffFilters";
  import TreeNode from "../components/TreeNode.svelte";
  import type { DiffNode } from "../lib/types";

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
    filters: $sharedDiffFilters,
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
  function toggleFilter(id: SharedDiffFilterId): void {
    sharedDiffFilters.setFilter(id, !$sharedDiffFilters[id]);
  }

  const exportBaseName = "diff-tree";

  type ExportNodeRecord = {
    id: string;
    name: string;
    status: DiffNode["status"];
    declaredVersion: string;
    resolvedVersion: string;
    strictlyVersion?: string;
    prevDeclaredVersion?: string;
    prevResolvedVersion?: string;
    prevStrictlyVersion?: string;
    depth: number;
    descendantCount: number;
  };

  function toRecord(node: DiffNode): ExportNodeRecord {
    return {
      id: node.id,
      name: node.name,
      status: node.status,
      declaredVersion: node.declaredVersion,
      resolvedVersion: node.resolvedVersion,
      strictlyVersion: node.strictlyVersion,
      prevDeclaredVersion: node.prevDeclaredVersion,
      prevResolvedVersion: node.prevResolvedVersion,
      prevStrictlyVersion: node.prevStrictlyVersion,
      depth: node.depth,
      descendantCount: node.descendantCount,
    };
  }

  function visibleRecords(): ExportNodeRecord[] {
    return page.listing.items.map((node) => toRecord(node));
  }

  function downloadBlob(blob: Blob, filename: string): void {
    const previousHash = window.location.hash;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    window.location.hash = previousHash;
  }

  function downloadJson(): void {
    const payload = {
      summary: {
        searchQuery: page.search.query,
        filters: {
          added: $sharedDiffFilters.added,
          removed: $sharedDiffFilters.removed,
          changed: $sharedDiffFilters.changed,
          unchanged: $sharedDiffFilters.unchanged,
          favorites: $sharedDiffFilters.favorites,
        },
        visibleCount: page.listing.items.length,
      },
      nodes: visibleRecords(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    downloadBlob(blob, `${exportBaseName}.json`);
  }

  function escapeCsv(value: string | number | undefined): string {
    const text = value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadCsv(): void {
    const columns: (keyof ExportNodeRecord)[] = [
      "id",
      "name",
      "status",
      "declaredVersion",
      "resolvedVersion",
      "strictlyVersion",
      "prevDeclaredVersion",
      "prevResolvedVersion",
      "prevStrictlyVersion",
      "depth",
      "descendantCount",
    ];

    const rows = visibleRecords().map((record) =>
      columns.map((key) => escapeCsv(record[key])).join(","),
    );
    const csv = [columns.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `${exportBaseName}.csv`);
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
          checked={$sharedDiffFilters.added}
          on:click={() => toggleFilter("added")}
          disabled={!page.filters.added.available}
        /> Added</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          checked={$sharedDiffFilters.removed}
          on:click={() => toggleFilter("removed")}
          disabled={!page.filters.removed.available}
        /> Removed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          checked={$sharedDiffFilters.changed}
          on:click={() => toggleFilter("changed")}
          disabled={!page.filters.changed.available}
        /> Changed</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          checked={$sharedDiffFilters.unchanged}
          on:click={() => toggleFilter("unchanged")}
          disabled={!page.filters.unchanged.available}
        /> Unchanged</label
      >
    </div>
    <div class="column is-narrow">
      <label class="checkbox"
        ><input
          type="checkbox"
          checked={$sharedDiffFilters.favorites}
          on:click={() => toggleFilter("favorites")}
        />
        Favorites</label
      >
    </div>
  </div>
  <div slot="actions">
    <button class="button is-light" on:click={expandAll}>Expand All</button>
    <button class="button is-light" on:click={collapseAll}>Collapse All</button>
    <button class="button is-light" on:click={downloadJson}>Download JSON</button>
    <button class="button is-light" on:click={downloadCsv}>Download CSV</button>
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
