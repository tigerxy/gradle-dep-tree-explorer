<script lang="ts">
  import { state, updatesShowAll, expanded } from "../lib/stores";
  import { mvnUrl, domIdForNode, textMatches } from "../lib/utils";
  import { findNodeByPath } from "../lib/logic";
  import type { DepNode, ForcedUpdateInfo } from "../lib/types";

  // Recompute entries when relevant stores change by threading them as deps
  $: entries = buildEntries(
    $state.searchQuery,
    $updatesShowAll,
    $state.newRoot,
    $state.nodeIndexByGA,
    $state.forcedUpdates,
  );

  type Entry = {
    ga: string;
    resolved: string;
    declared: string;
    nodes: DepNode[];
    anyForced: boolean;
  };

  function buildEntries(
    search: string,
    showAll: boolean,
    root: DepNode | null,
    nodeIndexByGA: Map<string, DepNode[]>,
    forced: Map<string, ForcedUpdateInfo>,
  ): Entry[] {
    if (!root) return [];
    const list: Entry[] = [];
    const q = (search || "").trim().toLowerCase();
    const matchesEntry = (ga: string, nodes: DepNode[]): boolean => {
      if (!q) return true;
      if (ga.toLowerCase().includes(q)) return true;
      return nodes.some((n) => textMatches(search, n));
    };
    if (showAll) {
      for (const [ga, nodes] of nodeIndexByGA.entries()) {
        if (!matchesEntry(ga, nodes)) continue;
        const resolvedSet = new Set(nodes.map((n) => n.resolvedVersion).filter(Boolean));
        const declaredSet = new Set(nodes.map((n) => n.declaredVersion).filter(Boolean));
        const anyForced = nodes.some(
          (n) => n.declaredVersion && n.resolvedVersion && n.declaredVersion !== n.resolvedVersion,
        );
        list.push({
          ga,
          resolved: Array.from(resolvedSet).join(", "),
          declared: Array.from(declaredSet).join(", ") || "-",
          nodes,
          anyForced,
        });
      }
    } else {
      for (const [ga, f] of forced.entries()) {
        if (!matchesEntry(ga, f.nodes)) continue;
        list.push({
          ga,
          resolved: f.resolved,
          declared: Array.from(f.declared).join(", "),
          nodes: f.nodes,
          anyForced: true,
        });
      }
    }
    list.sort((a, b) => a.ga.localeCompare(b.ga));
    return list;
  }

  function jumpToPath(path: string): void {
    if (!$state.mergedRoot) return;
    const { node, ancestors } = findNodeByPath($state.mergedRoot, path);
    if (!node) return;
    // Expand minimal path
    const ids = new Set<string>($expanded);
    ancestors.forEach((a) => ids.add(a.id));
    ids.add(node.id);
    expanded.set(ids);
    // Switch to diff and scroll after a small delay
    location.hash = "#diff";
    setTimeout(() => {
      const el = document.getElementById(domIdForNode({ id: node.id }));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("blink");
        setTimeout(() => el.classList.remove("blink"), 1200);
      }
    }, 80);
  }

  function getPathsFor(ga: string): string[] {
    const s = $state.gaToPaths.get(ga);
    return s ? Array.from(s) : [];
  }
</script>

<h1 class="title">Updates</h1>
<p class="subtitle">
  Suggested dependencies to review because Gradle resolved a different version than declared.
</p>

<div class="field">
  <label class="checkbox">
    <input type="checkbox" bind:checked={$updatesShowAll} />
    Show all dependencies (not only forced updates)
  </label>
</div>

{#if !$state.newRoot}
  <p class="has-text-grey">Parse a current dependency tree first.</p>
{:else if !entries.length}
  <p class="has-text-success">No forced updates detected.</p>
{:else}
  {#each entries as item (item.ga)}
    <article class="message {item.anyForced ? 'is-warning' : 'is-light'}">
      <div class="message-header">
        <p>
          <strong>{item.ga}</strong> — resolved: <code>{item.resolved}</code>, declared:
          <code>{item.declared}</code>
        </p>
        <div>
          <button
            class="button is-ghost {$state.favorites.has(item.ga) ? 'fav' : ''}"
            title="Toggle favorite"
            on:click={() => state.toggleFavorite(item.ga)}
          >
            <span class="icon">
              <i class={$state.favorites.has(item.ga) ? "fas fa-star" : "far fa-star"}></i>
            </span>
          </button>
          <a class="button is-outlined" href={mvnUrl(item.ga)} target="_blank" rel="noopener">
            mvnrepo
          </a>
        </div>
      </div>
      <div class="message-body">
        <details>
          <summary>Show all paths for this dependency</summary>
          <ul class="is-mono">
            {#each getPathsFor(item.ga) as p (p)}
              <li class="is-flex is-justify-content-space-between is-align-items-center">
                {p}
                &nbsp;
                <button class="button is-small is-light" on:click={() => jumpToPath(p)}>
                  <span class="icon">
                    <i class="fa-solid fa-folder-tree"></i>
                  </span>
                  <span>Diff Tree</span>
                </button>
              </li>
            {/each}
          </ul>
        </details>
      </div>
    </article>
  {/each}
{/if}
