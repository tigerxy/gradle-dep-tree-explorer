import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { jumpToDiffNode } from "../../src/pages/graphPageNavigation";
import { domIdForNode } from "../../src/lib/utils";

describe("jumpToDiffNode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    location.hash = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("updates the hash even when no target element exists", () => {
    jumpToDiffNode("missing", 10, 20);
    expect(location.hash).toBe("#diff");

    vi.runAllTimers();
    expect(location.hash).toBe("#diff");
  });

  it("scrolls to and blinks the target element", () => {
    const nodeId = "node-1";
    const el = document.createElement("div");
    el.id = domIdForNode({ id: nodeId });
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);

    jumpToDiffNode(nodeId, 10, 20);
    vi.advanceTimersByTime(10);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(el.classList.contains("blink")).toBe(true);

    vi.advanceTimersByTime(20);
    expect(el.classList.contains("blink")).toBe(false);
  });
});
