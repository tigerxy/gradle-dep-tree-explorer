import { describe, it, expect, vi } from "vitest";
import type { GraphModel, GraphNode } from "../../../src/lib/graph/buildGraphModel";
import { renderGraph } from "../../../src/lib/graph/renderGraph";
import type * as d3 from "d3";

type BBoxElement = SVGElement & {
  getBBox?: () => { x: number; y: number; width: number; height: number };
};

const svg = () => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
  el.setAttribute("width", "200");
  el.setAttribute("height", "200");
  document.body.appendChild(el);
  return el;
};

const baseModel: GraphModel = {
  hasData: true,
  emptyMessage: "empty",
  root: {
    data: { id: "root", label: "Root", status: "unchanged", children: [] },
  } as d3.HierarchyNode<GraphNode>,
  nodes: [
    {
      x: 0,
      y: 0,
      data: { id: "n1", label: "Node 1", status: "unchanged" },
    },
    {
      x: 5,
      y: 5,
      data: { id: "n2", label: "Added", status: "added" },
    },
    {
      x: 10,
      y: 10,
      data: { id: "n3", label: "Removed", status: "removed" },
    },
    {
      x: 15,
      y: 15,
      data: { id: "n4", label: "Changed", status: "changed" },
    },
  ] as d3.HierarchyNode<GraphNode>[],
  links: [],
};

describe("renderGraph", () => {
  it("returns noop renderer when no data is present", () => {
    const renderer = renderGraph({
      svgEl: svg(),
      model: { ...baseModel, hasData: false, root: null, emptyMessage: "none" },
      isDark: false,
      onNodeClick: vi.fn(),
    });

    expect(typeof renderer.fit).toBe("function");
    expect(typeof renderer.resetZoom).toBe("function");
    renderer.fit();
    renderer.resetZoom();
  });

  it("renders nodes and wires click handler", () => {
    (SVGElement.prototype as BBoxElement).getBBox = () => ({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const onNodeClick = vi.fn();
    const svgEl = svg();

    const renderer = renderGraph({
      svgEl,
      model: {
        ...baseModel,
        links: [
          {
            source: { x: 0, y: 0 } as d3.HierarchyPointNode<GraphNode>,
            target: { x: 10, y: 10 } as d3.HierarchyPointNode<GraphNode>,
          },
        ],
      },
      isDark: false,
      onNodeClick,
    });

    const circle = svgEl.querySelector("circle");
    expect(circle).toBeTruthy();
    circle?.dispatchEvent(new MouseEvent("click"));
    expect(onNodeClick).toHaveBeenCalledWith("n1");

    renderer.fit();
    renderer.resetZoom();
  });

  it("uses dark fill for unchanged nodes", () => {
    const svgEl = svg();
    renderGraph({
      svgEl,
      model: baseModel,
      isDark: true,
      onNodeClick: vi.fn(),
    });
    const unchanged = svgEl.querySelector("circle");
    expect(unchanged?.getAttribute("fill")).toBe("#777");
  });

  it("skips fitting when getBBox is unavailable", () => {
    const svgEl = svg();
    const originalGetBBox = (SVGElement.prototype as BBoxElement).getBBox;
    delete (SVGElement.prototype as BBoxElement).getBBox;

    const renderer = renderGraph({
      svgEl,
      model: baseModel,
      isDark: false,
      onNodeClick: vi.fn(),
    });

    expect(() => renderer.fit()).not.toThrow();
    (SVGElement.prototype as BBoxElement).getBBox = originalGetBBox;
  });
});
