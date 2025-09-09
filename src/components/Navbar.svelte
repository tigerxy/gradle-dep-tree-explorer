<script lang="ts">
  import { route, state } from "../lib/stores";
  import type { Route } from "../lib/types";

  let burgerOpen: boolean = false;
  let currentSearch: string = "";

  function go(to: Route) {
    location.hash = `#${to}`;
    route.set(to);
    burgerOpen = false;
  }

  import { onMount } from "svelte";
  onMount(() => {
    currentSearch = $state.searchQuery || "";
  });

  function clearSearch() {
    currentSearch = "";
    const el = document.getElementById("searchInput") as HTMLInputElement | null;
    if (el) el.value = "";
    state.setSearchQuery("");
  }

  function performSearch() {
    const el = document.getElementById("searchInput") as HTMLInputElement | null;
    const value = el ? el.value : currentSearch;
    state.setSearchQuery((value || "").trim());
  }
</script>

<nav class="navbar is-primary is-fixed-top" aria-label="Main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="#input" on:click|preventDefault={() => go("input")}
      ><strong>Gradle Dep Tree Explorer</strong></a
    >
    <button
      type="button"
      class="navbar-burger"
      aria-label="menu"
      aria-expanded={burgerOpen}
      aria-controls="navMenu"
      class:is-active={burgerOpen}
      on:click={() => (burgerOpen = !burgerOpen)}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </button>
  </div>

  <div id="navMenu" class="navbar-menu" class:is-active={burgerOpen}>
    <div class="navbar-start">
      <a
        class="navbar-item"
        class:is-active={$route === "input"}
        aria-current={$route === "input" ? "page" : undefined}
        href="#input"
        on:click|preventDefault={() => go("input")}>Input</a
      >
      <a
        class="navbar-item"
        class:is-active={$route === "diff"}
        aria-current={$route === "diff" ? "page" : undefined}
        href="#diff"
        on:click|preventDefault={() => go("diff")}>Diff Tree</a
      >
      <a
        class="navbar-item"
        class:is-active={$route === "updates"}
        aria-current={$route === "updates" ? "page" : undefined}
        href="#updates"
        on:click|preventDefault={() => go("updates")}>Updates</a
      >
      <a
        class="navbar-item"
        class:is-active={$route === "graph"}
        aria-current={$route === "graph" ? "page" : undefined}
        href="#graph"
        on:click|preventDefault={() => go("graph")}>Graph</a
      >
    </div>
    <div class="navbar-end">
      <div class="navbar-item">
        <div class="field has-addons" style="min-width: 360px;">
          <p class="control is-expanded has-icons-right">
            <input
              class="input is-medium"
              type="text"
              id="searchInput"
              placeholder="Search... (regex)"
              bind:value={currentSearch}
              on:keydown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  performSearch();
                }
              }}
            />
            <span class="icon is-medium is-right">
              <button
                id="searchDelete"
                type="button"
                class="delete is-medium"
                title="Clear search"
                aria-label="clear"
                on:click={clearSearch}
              ></button>
            </span>
          </p>
          <p class="control">
            <button class="button is-medium" title="Go" on:click={performSearch}>Go</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</nav>

<style></style>
