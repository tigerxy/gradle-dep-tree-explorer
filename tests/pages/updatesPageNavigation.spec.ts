import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DiffNode } from "../../src/lib/types";
import { getPathsForDependency, jumpToDiffPath } from "../../src/pages/updatesPageNavigation";
import { domIdForNode } from "../../src/lib/utils";

const leaf: DiffNode = {
  id: "leaf",
  name: "com.example:leaf",
  declaredVersion: "1.0.0",
  resolvedVersion: "1.0.0",
  prevDeclaredVersion: undefined,
  prevResolvedVersion: undefined,
  status: "unchanged",
  children: [],
  depth: 1,
  descendantCount: 0,
};

const root: DiffNode = {
  id: "root",
  name: "root:root",
  declaredVersion: "",
  resolvedVersion: "",
  prevDeclaredVersion: undefined,
  prevResolvedVersion: undefined,
  status: "unchanged",
  children: [leaf],
  depth: 0,
  descendantCount: 1,
};

describe("updatesPageNavigation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    location.hash = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("returns dependency paths or an empty list", () => {
    const gaToPaths = new Map([["com.example:leaf", new Set(["com.example:leaf:1.0.0"])]]);

    expect(getPathsForDependency(gaToPaths, "com.example:leaf")).toEqual(["com.example:leaf:1.0.0"]);
    expect(getPathsForDependency(gaToPaths, "missing")).toEqual([]);
  });

  it("does nothing when the tree or path target is missing", () => {
    const setExpanded = vi.fn();

    jumpToDiffPath(null, [], "com.example:missing:9.9.9", setExpanded, 10, 20);
    jumpToDiffPath(root, [], "", setExpanded, 10, 20);

    expect(setExpanded).not.toHaveBeenCalled();
    expect(location.hash).toBe("");
  });

  it("expands, scrolls, and blinks the matching node", () => {
    const setExpanded = vi.fn();
    const target = document.createElement("div");
    target.id = domIdForNode({ id: leaf.id });
    const scrollIntoView = vi.fn();
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    jumpToDiffPath(root, [], "com.example:leaf:1.0.0", setExpanded, 10, 20);

    expect(setExpanded).toHaveBeenCalledTimes(1);
    expect(location.hash).toBe("#diff");

    vi.advanceTimersByTime(10);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(target.classList.contains("blink")).toBe(true);

    vi.advanceTimersByTime(20);
    expect(target.classList.contains("blink")).toBe(false);
  });
});
