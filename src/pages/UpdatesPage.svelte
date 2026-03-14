<script lang="ts">
  import { state, updatesShowAll, expanded } from "../lib/stores";
  import UpdatePathRows from "../components/UpdatePathRows.svelte";
  import { createUpdatesPageModel } from "../lib/pages/updatesPageModel";
  import { mvnUrl } from "../lib/utils";
  import { jumpToDiffPath } from "./updatesPageNavigation";
  import { favoriteButtonClass, favoriteIconClass, updateMessageClass } from "./updatesPageView";

  $: page = createUpdatesPageModel({
    root: $state.newRoot,
    searchQuery: $state.searchQuery,
    showAll: $updatesShowAll,
    nodeIndexByGA: $state.nodeIndexByGA,
    forcedUpdates: $state.forcedUpdates,
    gaToPaths: $state.gaToPaths,
  });

  function jumpToPath(path: string): void {
    jumpToDiffPath($state.mergedRoot, $expanded, path, expanded.set);
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

{#if !page.hasData}
  <p class="has-text-grey">Parse a current dependency tree first.</p>
{:else if !page.listing.items.length}
  <p class="has-text-success">No forced updates detected.</p>
{:else}
  {#each page.listing.items as item (item.ga)}
    <article class={updateMessageClass(item.anyForced)}>
      <div class="message-header">
        <p>
          <strong>{item.ga}</strong> — resolved: <code>{item.resolved}</code>, declared:
          <code>{item.declared}</code>
        </p>
        <div>
          <button
            class={favoriteButtonClass($state.favorites.has(item.ga))}
            title="Toggle favorite"
            on:click={() => state.toggleFavorite(item.ga)}
          >
            <span class="icon">
              <i class={favoriteIconClass($state.favorites.has(item.ga))}></i>
            </span>
          </button>
          <a class="button is-outlined" href={mvnUrl(item.ga)} target="_blank" rel="noopener">
            mvnrepo
          </a>
        </div>
      </div>
      <div class="message-body">
        <details>
          <summary>Resolution details</summary>
          <div class="content">
            <p>
              <strong>Selected version:</strong>
              <code>{item.resolved}</code>
            </p>

            {#if item.strictVersions.length}
              <p>Selected {item.resolved} because Gradle found a strict version constraint.</p>
              <p class="is-flex is-flex-wrap-wrap is-gap-2">
                <strong>Strict constraints:</strong>
                {#each item.strictVersions as version (version)}
                  <span class="tag is-link is-light">
                    <span class="icon">
                      <i class="fas fa-lock"></i>
                    </span>
                    <span>{version}</span>
                  </span>
                {/each}
              </p>
            {/if}

            {#if item.requestedVersions.length}
              <p><strong>Requested versions seen in the tree:</strong></p>
              <div class="tags">
                {#each item.requestedVersions as version (version)}
                  <span class="tag is-light is-mono">{version}</span>
                {/each}
              </div>
            {/if}

            {#if item.forcedRequestedVersions.length}
              <p>Gradle upgraded these requested versions to the selected version:</p>
              <div class="tags">
                {#each item.forcedRequestedVersions as version (version)}
                  <span class="tag is-warning is-light is-mono">
                    {version} → {item.resolved}
                  </span>
                {/each}
              </div>
            {/if}

            <div class="mt-4">
              <p><strong>Paths that requested or inherited this dependency</strong></p>
              <UpdatePathRows paths={item.paths} onJump={jumpToPath} />
            </div>
          </div>
        </details>
      </div>
    </article>
  {/each}
{/if}
