<script lang="ts">
  export let helpText: string = "";
</script>

<div class="box">
  <div class="columns is-vcentered is-mobile">
    <div class="column is-narrow"><strong>Filters:</strong></div>
    <slot name="filters" />
    <div class="column">
      <div class="buttons is-right">
        <slot name="actions" />
      </div>
    </div>
  </div>
  {#if helpText}
    <p class="help">{helpText}</p>
  {/if}
</div>
