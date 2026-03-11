import { describe, expect, it, vi } from "vitest";
import {
  domIdForNode,
  mvnUrl,
  pathToString,
  prefersDarkMode,
  textMatches,
} from "../../src/lib/utils";

describe("utils", () => {
  it("builds mvnrepository URLs with and without encoded versions", () => {
    expect(mvnUrl("org.example:artifact")).toBe(
      "https://mvnrepository.com/artifact/org.example/artifact",
    );
    expect(mvnUrl("org.example:artifact", "1.0.0 rc1")).toBe(
      "https://mvnrepository.com/artifact/org.example/artifact/1.0.0%20rc1",
    );
  });

  it("matches text queries against combined node fields", () => {
    const node = {
      name: "Org.Example:Artifact",
      declaredVersion: "1.0.0",
      resolvedVersion: "2.0.0",
    };

    expect(textMatches("", node)).toBe(true);
    expect(textMatches("artifact:1.0.0", node)).toBe(true);
    expect(textMatches("2.0.0", node)).toBe(true);
    expect(textMatches("missing", node)).toBe(false);
  });

  it("formats dependency paths and treats the synthetic root specially", () => {
    expect(pathToString([])).toBe("");
    expect(
      pathToString([
        { name: "root:root", resolvedVersion: "" },
        { name: "org.example:artifact", resolvedVersion: "1.2.3" },
        { name: "project:shared", resolvedVersion: "" },
      ]),
    ).toBe("root  ›  org.example:artifact:1.2.3  ›  project:shared");
  });

  it("derives safe DOM ids and falls back when a node is missing", () => {
    expect(domIdForNode({ id: "a:b/c d" })).toBe("node-a_b_c_d");
    expect(domIdForNode(null)).toBe("node-node");
  });

  it("detects dark mode only when matchMedia reports it", () => {
    const originalWindow = globalThis.window;

    // @ts-expect-error test override
    delete globalThis.window;
    expect(prefersDarkMode()).toBe(false);

    // @ts-expect-error test override
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    };
    expect(prefersDarkMode()).toBe(true);

    // @ts-expect-error restore
    globalThis.window = originalWindow;
  });
});
