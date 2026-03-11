import { beforeEach, describe, expect, it, vi } from "vitest";

const mountMock = vi.fn();

vi.mock("svelte", () => ({
  mount: mountMock,
}));

vi.mock("../src/App.svelte", () => ({
  default: { name: "App" },
}));

describe("main.ts", () => {
  beforeEach(() => {
    vi.resetModules();
    mountMock.mockReset();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("mounts the app into the #app element and re-exports the mount result", async () => {
    const mountedApp = { destroy: vi.fn() };
    mountMock.mockReturnValue(mountedApp);

    const module = await import("../src/main");

    expect(mountMock).toHaveBeenCalledWith(expect.anything(), {
      target: document.getElementById("app"),
    });
    expect(module.default).toBe(mountedApp);
  });
});
