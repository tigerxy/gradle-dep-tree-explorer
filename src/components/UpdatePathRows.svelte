<script lang="ts">
  import { createUpdatePathItems } from "../pages/updatesPagePaths";

  interface Props {
    paths: string[];
    onJump: (path: string) => void; // eslint-disable-line no-unused-vars
  }

  let { paths, onJump }: Props = $props();

  const items = $derived(createUpdatePathItems(paths));
</script>

<ul class="is-mono">
  {#each items as item, index (item.path + index)}
    <li class="is-flex is-justify-content-space-between is-align-items-center">
      <span>{item.path}</span>
      <button
        class="button is-small is-light"
        type="button"
        data-path={item.path}
        disabled={!item.canJump}
        hidden={!item.canJump}
        onclick={() => {
          if (!item.canJump) return;

          onJump(item.path);
        }}
      >
        <span class="icon"><i class="fa-solid fa-folder-tree"></i></span>
        <span>Diff Tree</span>
      </button>
    </li>
  {/each}
</ul>
