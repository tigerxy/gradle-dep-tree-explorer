<script lang="ts">
  import * as d3 from "d3";
  import { state, graphHideNonMatches } from "../lib/stores";
  import { textMatches, domIdForNode } from "../lib/utils";
  import type { DepNode } from "../lib/types";

  let svgEl: SVGSVGElement | null = null;
  let graphZoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;

  function render() {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    if (!$state.newRoot && !$state.mergedRoot) {
      g.append("text")
        .attr("x", 20)
        .attr("y", 30)
        .text("Parse a current dependency tree on the Input page to see the graph.");
      return;
    }

    const isDark = document.body.classList.contains("dark");
    const hideNonMatches = $graphHideNonMatches && ($state.searchQuery || "").trim().length > 0;

    function matches(n: DepNode): boolean {
      return textMatches($state.searchQuery, n);
    }
    function keep(n: DepNode): boolean {
      if (n.name === "root:root") return true;
      if (matches(n)) return true;
      return (n.children || []).some(keep);
    }
    function cloneIfKeep(n: DepNode): DepNode | null {
      if (!keep(n)) return null;
      const kids = (n.children || []).map(cloneIfKeep).filter(Boolean) as DepNode[];
      return { ...n, children: kids } as DepNode;
    }

    const sourceRoot: DepNode = (
      $state.diffAvailable ? ($state.mergedRoot as DepNode) : ($state.newRoot as DepNode)
    ) as DepNode;
    const data: DepNode = hideNonMatches
      ? (cloneIfKeep(sourceRoot) as DepNode)
      : structuredClone(sourceRoot);
    const root = d3.hierarchy(data as any, (d: any) => d.children);
    const layout = d3.tree().nodeSize([24, 200]);
    layout(root);

    graphZoom = d3
      .zoom<SVGSVGElement, unknown>()
      .on("zoom", (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", ev.transform);
      });
    svg.call(graphZoom);

    g.append("g")
      .selectAll("path")
      .data(root.links())
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", isDark ? "#555" : "#aaa")
      .attr("stroke-width", 1.2)
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d: { x: number; y: number }) => d.y)
          .y((d: { x: number; y: number }) => d.x),
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("transform", (d: d3.HierarchyNode<DepNode>) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", 4)
      .attr("stroke", "#333")
      .attr("fill", (d: d3.HierarchyNode<DepNode>) => {
        const st = d.data.status || "unchanged";
        if (st === "added") return "#48c774";
        if (st === "removed") return "#f14668";
        if (st === "changed") return "#ffe08a";
        return isDark ? "#777" : "#ddd";
      })
      .on("click", (_ev: unknown, d: any) => {
        const targetId = domIdForNode({ id: String(d.data.id) });
        location.hash = "#diff";
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            el.classList.add("blink");
            setTimeout(() => el.classList.remove("blink"), 1200);
          }
        }, 60);
      });

    node
      .append("text")
      .attr("dy", 3)
      .attr("x", 8)
      .attr("font-size", 12)
      .attr("fill", "currentColor")
      .text((d: d3.HierarchyNode<DepNode>) => {
        const star = $state.favorites.has(d.data.name) ? "★ " : "";
        return (
          star +
          (d.data.name === "root:root"
            ? "root"
            : `${d.data.name}${d.data.resolvedVersion ? ":" + d.data.resolvedVersion : ""}`)
        );
      });

    fit();
  }

  function fit() {
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const g = svg.select("g");
    if (g.empty()) return;
    const gnode: any = g.node();
    if (!gnode || typeof gnode.getBBox !== "function") return;
    const bbox = (gnode as SVGGraphicsElement).getBBox();
    const pad = 30;
    const w = svgEl.clientWidth,
      h = svgEl.clientHeight;
    const scale = Math.min(
      2.0,
      Math.max(0.1, Math.min((w - 2 * pad) / bbox.width, (h - 2 * pad) / bbox.height)),
    );
    const tx = (w - scale * (bbox.x + bbox.width)) / 2;
    const ty = (h - scale * (bbox.y + bbox.height)) / 2;
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    if (graphZoom)
      svg
        .transition()
        .duration(300)
        .call((graphZoom as any).transform, t);
  }

  function resetZoom() {
    if (!svgEl || !graphZoom) return;
    d3.select(svgEl).transition().duration(200).call(graphZoom.transform, d3.zoomIdentity);
  }

  // Re-render when relevant stores change
  $: (void $state, void $graphHideNonMatches, render());
</script>

<h1 class="title">Graph</h1>
<p class="subtitle">
  Interactive tree visualization. Use the global search. Toggle “Hide non-matches (Graph)” to focus.
</p>

<div class="navbar-item">
  <div class="field">
    <input
      id="hideNonMatchesGraph"
      type="checkbox"
      class="switch is-rounded"
      bind:checked={$graphHideNonMatches}
    />
    <label for="hideNonMatchesGraph">Hide non-matches (Graph)</label>
  </div>
</div>

<div class="buttons">
  <button class="button is-light" on:click={fit}>Fit</button>
  <button class="button is-light" on:click={resetZoom}>Reset zoom</button>
</div>

<div id="graphContainer" class="box">
  <svg
    bind:this={svgEl}
    id="graphSvg"
    width="100%"
    height="100%"
    role="img"
    aria-label="Dependency graph"
  ></svg>
</div>
