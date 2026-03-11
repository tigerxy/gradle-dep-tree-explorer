import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("vite.config", () => {
  it("keeps the expected build and test configuration", () => {
    expect(config.build).toMatchObject({
      assetsInlineLimit: 100000000,
      cssCodeSplit: false,
      target: "es2020",
    });
    expect(config.resolve).toEqual({ conditions: ["browser"] });
    expect(config.test).toMatchObject({
      environment: "happy-dom",
      include: ["tests/**/*.spec.ts"],
      setupFiles: ["tests/setup.ts"],
    });
  });
});
