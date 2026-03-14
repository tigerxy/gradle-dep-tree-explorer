import { describe, expect, it } from "vitest";
import { buildSearchMatchIndex, flattenTreePreorder } from "../../../src/lib/logic";

describe("tree/search", () => {
  it("precomputes direct matches and matching ancestors from a flattened tree", () => {
    const root = {
      id: "root",
      name: "root:root",
      children: [
        {
          id: "a",
          name: "org.example:alpha",
          children: [
            {
              id: "a1",
              name: "org.example:beta",
              children: [],
            },
          ],
        },
        {
          id: "b",
          name: "org.example:gamma",
          children: [],
        },
      ],
    };

    const result = buildSearchMatchIndex(flattenTreePreorder(root), (node) =>
      node.name.includes("beta"),
    );

    expect(result.matchingNodeIds).toEqual(new Set(["a1"]));
    expect(result.matchingAncestorIds).toEqual(new Set(["root", "a"]));
  });

  it("returns empty match sets when the tree is missing", () => {
    expect(buildSearchMatchIndex(null, () => true)).toEqual({
      matchingNodeIds: new Set(),
      matchingAncestorIds: new Set(),
    });
  });
});
