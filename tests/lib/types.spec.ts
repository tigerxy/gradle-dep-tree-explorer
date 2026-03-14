import { describe, it, expect } from "vitest";
import { typesModuleLoaded } from "../../src/lib/types";

describe("types barrel", () => {
  it("executes runtime marker for coverage", () => {
    expect(typesModuleLoaded).toBe(true);
  });
});
