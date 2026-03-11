import { describe, expect, it } from "vitest";
import { buildParentIdsById, findParentId } from "../../../src/lib/tree/parents";

const root = {
  id: "root",
  children: [
    {
      id: "a",
      children: [{ id: "a1", children: [] }],
    },
    { id: "b", children: [] },
  ],
};

describe("tree/parents", () => {
  it("builds a parent index for every non-root node", () => {
    expect(buildParentIdsById(root)).toEqual(
      new Map([
        ["a", "root"],
        ["a1", "a"],
        ["b", "root"],
      ]),
    );
  });

  it("finds a parent id or returns undefined when absent", () => {
    expect(findParentId(root, "a1")).toBe("a");
    expect(findParentId(root, "missing")).toBeUndefined();
  });
});
