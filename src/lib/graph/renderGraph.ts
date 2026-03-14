import * as d3 from "d3";
import type { GraphModel, GraphNode } from "./buildGraphModel";

export interface GraphRenderer {
  fit: () => void;
  resetZoom: () => void;
}

export interface RenderGraphInput {
  svgEl: SVGSVGElement;
  model: GraphModel;
  isDark: boolean;
  onNodeClick: (nodeId: string) => void;
}

function createNoopGraphRenderer(): GraphRenderer {
  return {
    fit() {},
    resetZoom() {},
  };
}

export function renderGraph(input: RenderGraphInput): GraphRenderer {
  const svg = d3.select(input.svgEl);
  svg.selectAll("*").remove();

  const g = svg.append("g");

  if (!input.model.hasData || !input.model.root) {
    g.append("text").attr("x", 20).attr("y", 30).text(input.model.emptyMessage);
    return createNoopGraphRenderer();
  }

  const graphZoom = d3
    .zoom<SVGSVGElement, unknown>()
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr("transform", event.transform);
    });
  svg.call(graphZoom);

  g.append("g")
    .selectAll("path")
    .data(input.model.links)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", input.isDark ? "#555" : "#aaa")
    .attr("stroke-width", 1.2)
    .attr(
      "d",
      d3
        .linkHorizontal<d3.HierarchyPointLink<GraphNode>, d3.HierarchyPointNode<GraphNode>>()
        .x((node) => node.y)
        .y((node) => node.x),
    );

  const node = g
    .append("g")
    .selectAll("g")
    .data(input.model.nodes)
    .enter()
    .append("g")
    .attr("transform", (entry) => `translate(${entry.y},${entry.x})`);

  node
    .append("circle")
    .attr("r", 4)
    .attr("stroke", "#333")
    .attr("fill", (entry) => {
      if (entry.data.status === "added") return "#48c774";
      if (entry.data.status === "removed") return "#f14668";
      if (entry.data.status === "changed") return "#ffe08a";
      return input.isDark ? "#777" : "#ddd";
    })
    .on("click", (_event, entry) => {
      input.onNodeClick(entry.data.id);
    });

  node
    .append("text")
    .attr("dy", 3)
    .attr("x", 8)
    .attr("transform", "rotate(-10)")
    .attr("font-size", 12)
    .attr("fill", "currentColor")
    .text((entry) => entry.data.label);

  const renderer: GraphRenderer = {
    fit() {
      const groupNode = g.node();
      if (!groupNode || typeof (groupNode as SVGGraphicsElement).getBBox !== "function") return;

      const bbox = (groupNode as SVGGraphicsElement).getBBox();
      const pad = 30;
      const width = input.svgEl.clientWidth;
      const height = input.svgEl.clientHeight;
      const scale = Math.min(
        2.0,
        Math.max(0.1, Math.min((width - 2 * pad) / bbox.width, (height - 2 * pad) / bbox.height)),
      );
      const tx = (width - scale * (bbox.x + bbox.width)) / 2;
      const ty = (height - scale * (bbox.y + bbox.height)) / 2;
      const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

      svg.transition().duration(300).call(graphZoom.transform, transform);
    },
    resetZoom() {
      svg.transition().duration(200).call(graphZoom.transform, d3.zoomIdentity);
    },
  };

  renderer.fit();
  return renderer;
}
