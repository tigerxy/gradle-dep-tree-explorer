<script lang="ts">
  import { onMount } from "svelte";
  import Navbar from "./components/Navbar.svelte";
  import { route } from "./lib/stores";
  import type { Route } from "./lib/types";
  import InputPage from "./pages/InputPage.svelte";
  import DiffTreePage from "./pages/DiffTreePage.svelte";
  import UpdatesPage from "./pages/UpdatesPage.svelte";
  import GraphPage from "./pages/GraphPage.svelte";

  // Simple hash routing sync
  function onHash(): void {
    const raw = location.hash.replace("#", "") || "input";
    const valid: readonly Route[] = ["input", "diff", "updates", "graph"] as const;
    const next: Route = (valid as readonly string[]).includes(raw) ? (raw as Route) : "input";
    route.set(next);
  }
  onMount(() => {
    window.addEventListener("hashchange", onHash);
    onHash();
    document.body.classList.add("has-navbar-fixed-top");
  });
</script>

<Navbar />

<section class="section">
  <div class="container">
    <div class={"page " + ($route === "input" ? "is-active" : "")}>
      <InputPage />
    </div>
    <div class={"page " + ($route === "diff" ? "is-active" : "")}>
      <DiffTreePage />
    </div>
    <div class={"page " + ($route === "updates" ? "is-active" : "")}>
      <UpdatesPage />
    </div>
    <div class={"page " + ($route === "graph" ? "is-active" : "")}>
      <GraphPage />
    </div>
  </div>
</section>
