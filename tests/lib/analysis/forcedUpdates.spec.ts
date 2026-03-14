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

  it("records paths even when no version mismatch exists", () => {
    const simpleRoot: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 1,
      children: [
        {
          id: "c",
          name: "org.example:gamma",
          declaredVersion: "1.0.0",
          resolvedVersion: "1.0.0",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
      ],
    };

    const { forcedUpdates, gaToPaths } = computeForcedUpdates(simpleRoot);
    expect(forcedUpdates.size).toBe(0);
    expect(Array.from(gaToPaths.get("org.example:gamma") ?? [])).toEqual([
      "org.example:gamma:1.0.0",
    ]);
  });

  it("ignores empty paths for the synthetic root node", () => {
    const rootOnly: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 0,
      children: [],
    };

    const { forcedUpdates, gaToPaths } = computeForcedUpdates(rootOnly);
    expect(forcedUpdates.size).toBe(0);
    expect(gaToPaths.size).toBe(0);
  });

  it("skips forced-update recording when resolved version is missing but still tracks paths", () => {
    const rootPartial: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 1,
      children: [
        {
          id: "d",
          name: "org.example:delta",
          declaredVersion: "1.0.0",
          resolvedVersion: "",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
      ],
    };

    const { forcedUpdates, gaToPaths } = computeForcedUpdates(rootPartial);
    expect(forcedUpdates.size).toBe(0);
    expect(Array.from(gaToPaths.get("org.example:delta") ?? [])).toEqual(["org.example:delta"]);
  });

  it("reuses existing path sets when the same GA appears multiple times", () => {
    const duplicateRoot: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 2,
      children: [
        {
          id: "x1",
          name: "org.example:repeat",
          declaredVersion: "1.0.0",
          resolvedVersion: "2.0.0",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
        {
          id: "x2",
          name: "org.example:repeat",
          declaredVersion: "2.0.0",
          resolvedVersion: "3.0.0",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
      ],
    };

    const { gaToPaths } = computeForcedUpdates(duplicateRoot);
    expect(gaToPaths.get("org.example:repeat")?.size).toBe(2);
  });

  it("tracks resolved-only entries without producing forced updates", () => {
    const resolvedOnly: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 1,
      children: [
        {
          id: "e",
          name: "org.example:epsilon",
          declaredVersion: "",
          resolvedVersion: "2.0.0",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
      ],
    };

    const { forcedUpdates, gaToPaths } = computeForcedUpdates(resolvedOnly);
    expect(forcedUpdates.size).toBe(0);
    expect(Array.from(gaToPaths.get("org.example:epsilon") ?? [])).toEqual([
      "org.example:epsilon:2.0.0",
    ]);
  });

  it("does not treat strict constraints as forced updates when the selected version matches", () => {
    const strictRoot: DependencyNode = {
      id: "root",
      name: "root:root",
      declaredVersion: "",
      resolvedVersion: "",
      depth: 0,
      descendantCount: 1,
      children: [
        {
          id: "strict",
          name: "org.example:locked",
          declaredVersion: "2.1.20",
          resolvedVersion: "2.1.20",
          strictlyVersion: "2.1.20",
          depth: 1,
          descendantCount: 0,
          children: [],
        },
      ],
    };

    const { forcedUpdates, gaToPaths } = computeForcedUpdates(strictRoot);
    expect(forcedUpdates.size).toBe(0);
    expect(Array.from(gaToPaths.get("org.example:locked") ?? [])).toEqual([
      "org.example:locked:2.1.20",
    ]);
  });
});
