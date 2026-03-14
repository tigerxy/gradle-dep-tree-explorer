import { domIdForNode } from "../lib/utils";

export function jumpToDiffNode(nodeId: string, delayMs = 60, blinkMs = 1200): void {
  const targetId = domIdForNode({ id: nodeId });
  location.hash = "#diff";

  setTimeout(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("blink");
    setTimeout(() => el.classList.remove("blink"), blinkMs);
  }, delayMs);
}
