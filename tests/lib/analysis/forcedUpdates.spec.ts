import { describe, expect, it } from "vitest";
import { computeForcedUpdates } from "../../../src/lib/analysis/forcedUpdates";
import type { DependencyNode } from "../../../src/lib/types";

const root: DependencyNode = {
  id: "root",
  name: "root:root",
  declaredVersion: "",
  resolvedVersion: "",
  depth: 0,
  descendantCount: 3,
  children: [
    {
      id: "a",
      name: "org.example:alpha",
      declaredVersion: "1.0.0",
      resolvedVersion: "2.0.0",
      depth: 1,
      descendantCount: 1,
      children: [
        {
          id: "a1",
          name: "org.example:alpha",
          declaredVersion: "1.1.0",
          resolvedVersion: "2.0.0",
          depth: 2,
          descendantCount: 0,
          children: [],
        },
      ],
    },
    {
      id: "b",
      name: "org.example:beta",
      declaredVersion: "3.0.0",
      resolvedVersion: "3.0.0",
      depth: 1,
      descendantCount: 0,
      children: [],
    },
  ],
};

describe("analysis/forcedUpdates", () => {
  it("aggregates forced updates and records all rendered paths", () => {
    const { forcedUpdates, gaToPaths } = computeForcedUpdates(root);

    expect(forcedUpdates.get("org.example:alpha")).toMatchObject({
      resolved: "2.0.0",
    });
    expect(Array.from(forcedUpdates.get("org.example:alpha")?.declared ?? [])).toEqual([
      "1.0.0",
      "1.1.0",
    ]);
    expect(forcedUpdates.get("org.example:alpha")?.nodes.map((node) => node.id)).toEqual([
      "a",
      "a1",
    ]);
    expect(Array.from(gaToPaths.get("org.example:alpha") ?? [])).toEqual([
      "org.example:alpha:2.0.0",
      "org.example:alpha:2.0.0  ›  org.example:alpha:2.0.0",
    ]);
    expect(gaToPaths.get("org.example:beta")).toEqual(new Set(["org.example:beta:3.0.0"]));
    expect(forcedUpdates.has("org.example:beta")).toBe(false);
  });
});
