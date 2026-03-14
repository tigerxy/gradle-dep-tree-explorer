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
    <article class={updateMessageClass(item.hasVersionChange)}>
      <div class="message-header">
        <p>
          <strong>{item.ga}</strong> — selected version: <code>{item.selectedVersion}</code>,
          requested versions: <code>{item.requestedVersionsLabel}</code>
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
          <summary>{item.detailsSummary}</summary>
          <div class="content">
            <p>
              <strong>Gradle selected:</strong>
              <code>{item.selectedVersion}</code>
            </p>

            {#if item.strictVersions.length}
              <p>
                Gradle had at least one strict constraint for this dependency, which is strong
                version selection input.
              </p>
            {/if}

            <p>
              The sections below show which paths applied strict constraints, which paths already
              asked for the selected version, and which paths asked for a different version that
              Gradle changed to the selected one.
            </p>

            {#if item.pathGroups.length}
              <div class="mt-4">
                <p><strong>Supporting paths</strong></p>
                {#each item.pathGroups as group (`${group.kind}:${group.version}`)}
                  <section class="mb-4">
                    {#if group.kind === "strict"}
                      <p>These paths applied a strict constraint to {group.version}:</p>
                    {:else if group.kind === "changed"}
                      <p>
                        These paths asked for {group.version}, but Gradle selected
                        {item.selectedVersion} instead:
                      </p>
                    {:else if group.version}
                      <p>These paths already asked for {group.version}:</p>
                    {:else}
                      <p>
                        These paths inherited the selected version without a direct version request:
                      </p>
                    {/if}

                    <UpdatePathRows paths={group.paths} onJump={jumpToPath} />
                  </section>
                {/each}
              </div>
            {/if}
          </div>
        </details>
      </div>
    </article>
  {/each}
{/if}
