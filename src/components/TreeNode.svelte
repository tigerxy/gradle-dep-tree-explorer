<script lang="ts">
  import { state, expanded } from "../lib/stores";
  import { mvnUrl, domIdForNode, textMatches } from "../lib/utils";
  import { hasMatchOrDesc } from "../lib/logic";
  import type { DepNode } from "../lib/types";

  export let node: DepNode;
  export let filtersEnabled: boolean = false;
  export let filterAdded: boolean = false;
  export let filterRemoved: boolean = false;
  export let filterChanged: boolean = false;
  export let filterUnchanged: boolean = false;
  export let filterFavorites: boolean = false;
  export let searchQuery: string = "";

  const id: string = domIdForNode(node);
  const hasChildren: boolean = (node.children && node.children.length) > 0;

  function matchesOwnFilters(n: DepNode): boolean {
    if (!filtersEnabled) return true;
    const st = n.status || "unchanged";
    const anyStatus = filterAdded || filterRemoved || filterChanged || filterUnchanged;
    const stOk = !anyStatus
      ? true
      : (st === "added" && filterAdded) ||
        (st === "removed" && filterRemoved) ||
        (st === "changed" && filterChanged) ||
        (st === "unchanged" && filterUnchanged);
    const favOk = !filterFavorites || $state.favorites.has(n.name);
    return stOk && favOk;
  }

  function shouldRender(n: DepNode): boolean {
    const q = searchQuery;
    const searchOk = !q || hasMatchOrDesc(n, q, textMatches);
    if (!searchOk) return false;
    if (matchesOwnFilters(n)) return true;
    return (n.children || []).some(shouldRender);
  }

  let visible: boolean;
  let hasMatch: boolean;
  let open: boolean;
  // Make visibility recompute when any filter changes or favorites update
  $: visible =
    (filterAdded,
    filterRemoved,
    filterChanged,
    filterUnchanged,
    filterFavorites,
    filtersEnabled,
    $state.favorites.size,
    searchQuery,
    shouldRender(node));
  $: hasMatch = hasMatchOrDesc(node, searchQuery, textMatches);
  $: open = $expanded.has(node.id) || (!!searchQuery && hasMatch);

  function toggle(): void {
    expanded.toggle(node.id);
  }
  function toggleFav(e: MouseEvent): void {
    e.stopPropagation();
    state.toggleFavorite(node.name);
  }
  function jumpParent(e: MouseEvent): void {
    e.stopPropagation();
    if (node.parent) {
      const pid = domIdForNode(node.parent);
      const pel = document.getElementById(pid);
      if (pel) {
        pel.scrollIntoView({ behavior: "smooth", block: "start" });
        pel.classList.add("blink");
        setTimeout(() => pel.classList.remove("blink"), 1200);
      }
    }
  }
</script>

{#if visible}
  <li {id}>
    <div
      class="node-row"
      data-id={node.id}
      role="button"
      tabindex="0"
      aria-expanded={open}
      on:click={toggle}
      on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <span class="icon-text">
        {#if hasChildren}
          <span class="caret {open ? 'open' : ''}">
            <i class="fa-solid fa-caret-right"></i>
          </span>
        {/if}
        <strong>{node.name}</strong>
        {#if node.status === "changed" && node.prevDeclaredVersion && node.declaredVersion && node.prevDeclaredVersion !== node.declaredVersion}
          <span class="tag is-warning is-mono" title="declared version change">
            decl {node.prevDeclaredVersion} → {node.declaredVersion}
          </span>
        {:else if $state.diffAvailable && node.status && node.status !== "unchanged"}
          <span
            class="tag {node.status === 'added'
              ? 'is-success'
              : node.status === 'removed'
                ? 'is-danger'
                : 'is-dark'}"
          >
            {node.declaredVersion}
          </span>
        {:else if node.declaredVersion}
          <!-- Always show version even when no diff/unchanged -->
          <span class="tag is-light is-mono soft" title="resolved version">
            {node.declaredVersion}
          </span>
        {/if}
        {#if node.declaredVersion && node.resolvedVersion && node.declaredVersion !== node.resolvedVersion}
          <span class="tag is-warning is-mono" title="declared version change">
            force {node.declaredVersion} → {node.resolvedVersion}
          </span>
        {/if}
        {#if node.descendantCount}
          <span class="tag is-light soft" title="recursive children">
            {node.descendantCount}
          </span>
        {/if}
        {#if node.parent}
          <button class="button is-small is-ghost" title="Jump to parent" on:click={jumpParent}>
            <span class="icon">
              <i class="fas fa-turn-up"></i>
            </span>
          </button>
        {/if}
        <button
          class="button is-small is-ghost {$state.favorites.has(node.name) ? 'fav' : ''}"
          title="Toggle favorite"
          on:click={toggleFav}
        >
          <span class="icon">
            <i class={$state.favorites.has(node.name) ? "fas fa-star" : "far fa-star"}></i>
          </span>
        </button>
      </span>
      <span>
        {#if node.name && node.name.includes(":") && node.name !== "root:root" && !String(node.name).startsWith("virtual:")}
          <span class="tag is-info is-light">
            <a href={mvnUrl(node.name)} target="_blank" rel="noopener">mvnrepo</a>
          </span>
        {/if}
      </span>
    </div>
    {#if hasChildren}
      <ul style="display: {open ? 'block' : 'none'};">
        {#each node.children as child}
          <svelte:self
            node={child}
            {filtersEnabled}
            {filterAdded}
            {filterRemoved}
            {filterChanged}
            {filterUnchanged}
            {filterFavorites}
            {searchQuery}
          />
        {/each}
      </ul>
    {/if}
  </li>
{/if}
