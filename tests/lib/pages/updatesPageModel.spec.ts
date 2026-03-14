import { describe, it, expect } from "vitest";
import { createUpdatesPageModel } from "../../../src/lib/pages/updatesPageModel";
import type { DependencyNode, ForcedUpdateInfo } from "../../../src/lib/types";

const forcedNode: DependencyNode = {
  id: "ga",
  name: "com.acme:lib",
  declaredVersion: "1.0.0",
  resolvedVersion: "2.0.0",
  children: [],
  depth: 1,
  descendantCount: 0,
};

const root: DependencyNode = {
  id: "root",
  name: "root:root",
  declaredVersion: "",
  resolvedVersion: "",
  children: [forcedNode],
  depth: 0,
  descendantCount: 1,
};

describe("createUpdatesPageModel", () => {
  it("filters by GA text match when search is active", () => {
    const model = createUpdatesPageModel({
      root,
      searchQuery: "acme",
      showAll: true,
      nodeIndexByGA: new Map([["com.acme:lib", [forcedNode]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map(),
    });

    expect(model.listing.items.length).toBe(1);
    expect(model.listing.items[0].anyForced).toBe(true);
  });

  it("falls back to node match search when GA does not match", () => {
    const model = createUpdatesPageModel({
      root,
      searchQuery: "lib",
      showAll: true,
      nodeIndexByGA: new Map([["com.example:other", [forcedNode]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map(),
    });

    expect(model.listing.items.length).toBe(1);
    expect(model.listing.items[0].ga).toBe("com.example:other");
  });

  it("lists forced updates when showAll is disabled", () => {
    const forcedInfo: ForcedUpdateInfo = {
      resolved: "2.0.0",
      declared: new Set(["1.0.0"]),
      nodes: [forcedNode],
      paths: new Set(["root:root -> com.acme:lib"]),
    };

    const model = createUpdatesPageModel({
      root,
      searchQuery: "",
      showAll: false,
      nodeIndexByGA: new Map(),
      forcedUpdates: new Map([["com.acme:lib", forcedInfo]]),
      gaToPaths: new Map(),
    });

    expect(model.listing.items.length).toBe(1);
    expect(model.listing.items[0].anyForced).toBe(true);
    expect(model.hasData).toBe(true);
  });

  it("skips entries when search does not match", () => {
    const model = createUpdatesPageModel({
      root,
      searchQuery: "nomatch",
      showAll: true,
      nodeIndexByGA: new Map([["com.acme:lib", [forcedNode]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map(),
    });

    expect(model.listing.items.length).toBe(0);
  });

  it("skips forced updates when search does not match", () => {
    const forcedInfo: ForcedUpdateInfo = {
      resolved: "2.0.0",
      declared: new Set(["1.0.0"]),
      nodes: [forcedNode],
      paths: new Set(["root:root -> com.acme:lib"]),
    };
    const model = createUpdatesPageModel({
      root,
      searchQuery: "nomatch",
      showAll: false,
      nodeIndexByGA: new Map(),
      forcedUpdates: new Map([["com.acme:lib", forcedInfo]]),
      gaToPaths: new Map(),
    });

    expect(model.listing.items.length).toBe(0);
  });

  it("omits project dependencies from the updates listing", () => {
    const projectNode: DependencyNode = {
      id: "project-core-network",
      name: "project:core:network",
      declaredVersion: "",
      resolvedVersion: "",
      children: [],
      depth: 1,
      descendantCount: 0,
    };

    const model = createUpdatesPageModel({
      root: {
        ...root,
        children: [projectNode],
      },
      searchQuery: "",
      showAll: true,
      nodeIndexByGA: new Map([["project:core:network", [projectNode]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map(),
    });

    expect(model.listing.items).toEqual([]);
  });

  it("treats strict constraints as non-forced when declared and resolved versions match", () => {
    const strictNode: DependencyNode = {
      id: "strict-lib",
      name: "com.acme:strict-lib",
      declaredVersion: "2.1.20",
      resolvedVersion: "2.1.20",
      strictlyVersion: "2.1.20",
      children: [],
      depth: 1,
      descendantCount: 0,
    };

    const model = createUpdatesPageModel({
      root: {
        ...root,
        children: [strictNode],
      },
      searchQuery: "",
      showAll: true,
      nodeIndexByGA: new Map([["com.acme:strict-lib", [strictNode]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map(),
    });

    expect(model.listing.items).toEqual([
      expect.objectContaining({
        ga: "com.acme:strict-lib",
        declared: "2.1.20",
        resolved: "2.1.20",
        anyForced: false,
        strictVersions: ["2.1.20"],
        requestedVersions: ["2.1.20"],
        forcedRequestedVersions: [],
        paths: [],
      }),
    ]);
  });

  it("summarizes requested versions, forced versions, and paths for resolution details", () => {
    const nodeA: DependencyNode = {
      id: "forced-a",
      name: "com.acme:lib",
      declaredVersion: "1.0.0",
      resolvedVersion: "2.0.0",
      children: [],
      depth: 1,
      descendantCount: 0,
    };
    const nodeB: DependencyNode = {
      id: "forced-b",
      name: "com.acme:lib",
      declaredVersion: "1.5.0",
      resolvedVersion: "2.0.0",
      children: [],
      depth: 2,
      descendantCount: 0,
    };

    const model = createUpdatesPageModel({
      root: {
        ...root,
        children: [nodeA, nodeB],
      },
      searchQuery: "",
      showAll: true,
      nodeIndexByGA: new Map([["com.acme:lib", [nodeA, nodeB]]]),
      forcedUpdates: new Map(),
      gaToPaths: new Map([
        [
          "com.acme:lib",
          new Set(["root  ›  com.acme:lib:2.0.0", "root  ›  app  ›  com.acme:lib:2.0.0"]),
        ],
      ]),
    });

    expect(model.listing.items).toEqual([
      expect.objectContaining({
        ga: "com.acme:lib",
        resolved: "2.0.0",
        requestedVersions: ["1.0.0", "1.5.0"],
        forcedRequestedVersions: ["1.0.0", "1.5.0"],
        strictVersions: [],
        paths: ["root  ›  app  ›  com.acme:lib:2.0.0", "root  ›  com.acme:lib:2.0.0"],
      }),
    ]);
  });
});
