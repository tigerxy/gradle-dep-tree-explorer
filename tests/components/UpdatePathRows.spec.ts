import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import UpdatePathRows from "../../src/components/UpdatePathRows.svelte";

describe("UpdatePathRows", () => {
  it("renders a placeholder row for empty paths", async () => {
    const onJump = vi.fn();
    const { container, getByText } = render(UpdatePathRows, {
      target: document.getElementById("app")!,
      props: { paths: [], onJump },
    });

    expect(getByText("No dependency paths recorded.")).toBeTruthy();
    const button = container.querySelector("button[data-path]") as HTMLButtonElement | null;
    expect(button?.disabled).toBe(true);
    expect(button?.hidden).toBe(true);
    await fireEvent.click(button!);
    expect(onJump).not.toHaveBeenCalled();
  });

  it("delegates clicks for real paths", async () => {
    const onJump = vi.fn();
    const { container } = render(UpdatePathRows, {
      target: document.getElementById("app")!,
      props: { paths: ["a > b"], onJump },
    });

    const button = container.querySelector("button[data-path='a > b']") as HTMLButtonElement | null;
    expect(button?.disabled).toBe(false);
    await fireEvent.click(button!);
    expect(onJump).toHaveBeenCalledWith("a > b");
  });
});
