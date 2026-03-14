<script lang="ts">
  import { buildUpdatePathItemsHtml, createUpdatePathItems } from "../pages/updatesPagePaths";

  interface Props {
    paths: string[];
    onJump: (path: string) => void;
  }

  let { paths, onJump }: Props = $props();
  let listEl: HTMLUListElement | null = null;

  const items = $derived(createUpdatePathItems(paths));
  const itemsHtml = $derived(buildUpdatePathItemsHtml(items));

  $effect(() => {
    if (!listEl) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button[data-path]") as HTMLButtonElement | null;
      if (!button || button.disabled) return;

      onJump(button.dataset.path ?? "");
    };

    listEl.addEventListener("click", handleClick);
    return () => listEl?.removeEventListener("click", handleClick);
  });
</script>

<ul class="is-mono" bind:this={listEl}>
  {@html itemsHtml}
</ul>
