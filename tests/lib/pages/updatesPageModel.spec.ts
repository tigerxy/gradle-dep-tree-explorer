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
    });

    expect(model.listing.items.length).toBe(0);
  });
});
