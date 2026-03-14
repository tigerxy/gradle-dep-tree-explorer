<script lang="ts">
  import { state, expanded } from "../lib/stores";
  import type { DiffTreePageModel } from "../lib/pages/diffTreePageModel";
  import { mvnUrl, domIdForNode, hasForcedVersionChange } from "../lib/utils";
  import type { DiffNode } from "../lib/types";

  export let node: DiffNode;
  export let page: DiffTreePageModel;

  const id: string = domIdForNode(node);
  const hasChildren: boolean = (node.children && node.children.length) > 0;

  let visible: boolean;
  let hasMatch: boolean;
  let open: boolean;
  $: visible = ($state.favorites.size, page, page.visibleNodeIds.has(node.id));
  $: hasMatch = page.hasSearchMatch(node);
  $: open = $expanded.has(node.id) || (page.search.isActive && hasMatch);

  function toggle(): void {
    expanded.toggle(node.id);
  }
  function toggleFav(e: MouseEvent): void {
    e.stopPropagation();
    state.toggleFavorite(node.name);
  }
  let parentId: string | undefined;
  let hasParent: boolean;
  $: hasParent = node.depth > 0;
  $: parentId = $state.parentIdsById.get(node.id);
  function jumpParent(e: MouseEvent): void {
    e.stopPropagation();
    if (parentId) {
      const pid = domIdForNode({ id: parentId });
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
            {#if node.strictlyVersion}
              <i class="fas fa-lock" aria-hidden="true"></i>
            {/if}
            {node.declaredVersion}
          </span>
        {:else if node.declaredVersion}
          <!-- Always show version even when no diff/unchanged -->
          <span
            class="tag is-light is-mono soft"
            title={node.strictlyVersion ? "strict version constraint" : "resolved version"}
          >
            {#if node.strictlyVersion}
              <i class="fas fa-lock" aria-hidden="true"></i>
            {/if}
            {node.declaredVersion}
          </span>
        {/if}
        {#if hasForcedVersionChange(node.declaredVersion, node.resolvedVersion)}
          <span class="tag is-warning is-mono" title="declared version change">
            force {node.declaredVersion} → {node.resolvedVersion}
          </span>
        {/if}
        {#if node.descendantCount}
          <span class="tag is-light soft" title="recursive children">
            {node.descendantCount}
          </span>
        {/if}
        {#if hasParent}
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
        {#each node.children as child (child.id)}
          <svelte:self node={child} {page} />
        {/each}
      </ul>
    {/if}
  </li>
{/if}
