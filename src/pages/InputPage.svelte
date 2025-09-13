<script lang="ts">
  import { state, route, expanded } from "../lib/stores";

  let oldText: string = "";
  let newText: string = "";

  function onFile(input: HTMLInputElement, target: "old" | "new"): void {
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const text = String(r.result || "");
      if (target === "old") oldText = text;
      else newText = text;
    };
    r.readAsText(f);
  }

  // Inline samples at compile time (no fetch) while keeping them as files
  // Vite's ?raw imports bring the text content into the bundle

  // @ts-ignore - vite handles ?raw import
  import oldSampleText from "../samples/gradle-old.txt?raw";
  // @ts-ignore
  import newSampleText from "../samples/gradle-new.txt?raw";

  function loadSampleOld(): void {
    oldText = String(oldSampleText || "");
  }
  function loadSampleNew(): void {
    newText = String(newSampleText || "");
  }

  function clearOld(): void {
    oldText = "";
  }
  function clearNew(): void {
    newText = "";
  }

  function parseBuild(): void {
    if (!newText || !newText.trim()) {
      alert("Please provide a current dependency tree (right textarea).");
      return;
    }
    state.setTexts({ oldText, newText });
    state.parseAndBuild();
    expanded.reset($state.mergedRoot);
    route.set("diff");
    location.hash = "#diff";
  }
</script>

<h1 class="title">Input</h1>
<p class="subtitle">
  Paste or upload your Gradle dependency tree(s). The old tree is optional but enables diffs.
</p>

<div class="columns">
  <div class="column">
    <h2 class="title is-5">Old Dependency Tree (optional)</h2>
    <div class="field">
      <div class="control">
        <textarea
          class="textarea is-mono"
          rows="14"
          bind:value={oldText}
          placeholder="Paste old dependency tree here…"
        ></textarea>
      </div>
    </div>
    <div class="field is-grouped">
      <div class="control">
        <div class="file has-name is-fullwidth">
          <label class="file-label">
            <input
              class="file-input"
              type="file"
              accept=".txt,.log,.md,.gradle,.out"
              on:change={(e) => onFile(e.currentTarget, "old")}
            />
            <span class="file-cta"
              ><span class="file-icon"><i class="fa-solid fa-file-import"></i></span><span
                class="file-label">Upload old tree…</span
              ></span
            >
            <span class="file-name">{oldText ? "Loaded" : "No file selected"}</span>
          </label>
        </div>
      </div>
      <div class="control">
        <button class="button is-medium is-light" on:click={loadSampleOld}>
          <i class="fa-solid fa-democrat"></i>
        </button>
      </div>
      <div class="control">
        <button class="button is-medium is-danger" on:click={clearOld} aria-label="Clear old input">
          <i class="fa-solid fa-eraser"></i>
        </button>
      </div>
    </div>
  </div>

  <div class="column">
    <h2 class="title is-5">Current Dependency Tree</h2>
    <div class="field">
      <div class="control">
        <textarea
          class="textarea is-mono"
          rows="14"
          bind:value={newText}
          placeholder="Paste current dependency tree here…"
        ></textarea>
      </div>
    </div>
    <div class="field is-grouped">
      <div class="control">
        <div class="file has-name is-fullwidth">
          <label class="file-label">
            <input
              class="file-input"
              type="file"
              accept=".txt,.log,.md,.gradle,.out"
              on:change={(e) => onFile(e.currentTarget, "new")}
            />
            <span class="file-cta"
              ><span class="file-icon"><i class="fa-solid fa-file-import"></i></span><span
                class="file-label">Upload current tree…</span
              ></span
            >
            <span class="file-name">{newText ? "Loaded" : "No file selected"}</span>
          </label>
        </div>
      </div>
      <div class="control">
        <button class="button is-medium is-light" on:click={loadSampleNew}>
          <i class="fa-solid fa-democrat"></i>
        </button>
      </div>
      <div class="control">
        <button class="button is-medium is-danger" on:click={clearNew} aria-label="Clear new input">
          <i class="fa-solid fa-eraser"></i>
        </button>
      </div>
    </div>
  </div>
</div>

<div class="buttons">
  <button class="button is-primary is-large is-fullwidth" on:click={parseBuild}
    >Parse & Build Views</button
  >
</div>

<article class="message">
  <div class="message-header"><p>How to generate dependency trees</p></div>
  <div class="message-body content">
    <p>From the module you care about (e.g. <code>:app</code>):</p>
    <pre><code>./gradlew :app:dependencies --configuration releaseRuntimeClasspath --refresh-dependencies > deps.txt</code
      ></pre>
    <p>
      To compare two versions, run the command twice (before and after your change) and paste both
      results above. Only the current tree is required.
    </p>
  </div>
</article>

<article class="message">
  <div class="message-header"><p>Example dependency tree (short)</p></div>
  <div class="message-body">
    <pre class="is-mono" style="white-space: pre-wrap;">
releaseRuntimeClasspath - Resolved configuration for runtime for variant: release
+--- com.squareup.retrofit2:retrofit:2.9.0
|    +--- com.squareup.okhttp3:okhttp:4.9.1 -> 4.11.0
|    |    \--- com.squareup.okio:okio:2.10.0
|    \--- com.squareup.retrofit2:converter-moshi:2.9.0
|         +--- com.squareup.moshi:moshi:1.15.0
|         \--- com.squareup.okhttp3:okhttp:4.9.1 -> 4.11.0
+--- com.google.guava:guava:27.1-jre -> 32.1.2-jre
\--- androidx.core:core-ktx:1.8.0 -> 1.12.0 (*)
</pre>
  </div>
</article>
