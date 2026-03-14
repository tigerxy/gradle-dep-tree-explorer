import { describe, expect, it } from "vitest";
import { findNodeByPath, hasMatchOrDesc } from "../../../src/lib/tree/navigation";

function makeTree() {
  return {
    name: "root:root",
    resolvedVersion: "",
    children: [
      {
        name: "org.example:alpha",
        resolvedVersion: "1.0.0",
        children: [
          {
            name: "org.example:beta",
            resolvedVersion: "2.0.0",
            children: [],
          },
        ],
      },
    ],
  };
}

describe("tree/navigation", () => {
  it("detects direct and descendant matches", () => {
    const root = makeTree();
    const matches = (q: string, node: typeof root | (typeof root.children)[number]) =>
      node.name.includes(q);

    expect(hasMatchOrDesc(root, "root", matches)).toBe(true);
    expect(hasMatchOrDesc(root, "beta", matches)).toBe(true);
    expect(hasMatchOrDesc(root, "missing", matches)).toBe(false);
  });

  it("finds nodes by rendered path and returns traversed ancestors", () => {
    const root = makeTree();
    const result = findNodeByPath(
      root,
      "root  ›  org.example:alpha:1.0.0  ›  org.example:beta:2.0.0",
    );

    expect(result.node?.name).toBe("org.example:beta");
    expect(result.ancestors.map((node) => node.name)).toEqual([
      "org.example:alpha",
      "org.example:beta",
    ]);
  });

  it("handles empty or partially matching paths", () => {
    const root = makeTree();

    expect(findNodeByPath(root, "")).toEqual({ node: undefined, ancestors: [] });

    const partial = findNodeByPath(root, "root  ›  org.example:alpha:1.0.0  ›  missing");
    expect(partial.node?.name).toBe("org.example:alpha");
    expect(partial.ancestors.map((node) => node.name)).toEqual(["org.example:alpha"]);
  });

  it("safely handles missing roots and paths without the synthetic root prefix", () => {
    // @ts-expect-error intentional undefined root for coverage
    expect(findNodeByPath(undefined, "anything")).toEqual({ node: undefined, ancestors: [] });

    const root = makeTree();
    const result = findNodeByPath(root, "org.example:alpha:1.0.0");
    expect(result.node?.name).toBe("org.example:alpha");
    expect(result.ancestors[0]?.name).toBe("org.example:alpha");

    const rootOnly = findNodeByPath(root, "root");
    expect(rootOnly.node?.name).toBe("root:root");
    expect(rootOnly.ancestors).toEqual([]);

    const missingDesc = findNodeByPath(
      root,
      "root  ›  org.example:alpha:1.0.0  ›  org.example:missing:1.0.0",
    );
    expect(missingDesc.node?.name).toBe("org.example:alpha");
  });
});
