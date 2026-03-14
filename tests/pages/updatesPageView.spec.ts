import { describe, it, expect } from "vitest";
import {
  favoriteButtonClass,
  favoriteIconClass,
  updateMessageClass,
} from "../../src/pages/updatesPageView";

describe("updatesPageView", () => {
  it("returns the warning or light message class", () => {
    expect(updateMessageClass(true)).toBe("message is-warning");
    expect(updateMessageClass(false)).toBe("message is-light");
  });

  it("returns favorite button classes", () => {
    expect(favoriteButtonClass(true)).toBe("button is-ghost fav");
    expect(favoriteButtonClass(false)).toBe("button is-ghost ");
  });

  it("returns favorite icon classes", () => {
    expect(favoriteIconClass(true)).toBe("fas fa-star");
    expect(favoriteIconClass(false)).toBe("far fa-star");
  });
});
