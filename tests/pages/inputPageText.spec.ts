import { describe, it, expect } from "vitest";
import { normalizeInputText } from "../../src/pages/inputPageText";

describe("normalizeInputText", () => {
  it("returns strings as-is", () => {
    expect(normalizeInputText("hello")).toBe("hello");
  });

  it("falls back to an empty string for falsy values", () => {
    expect(normalizeInputText("")).toBe("");
    expect(normalizeInputText(null)).toBe("");
    expect(normalizeInputText(undefined)).toBe("");
  });
});
