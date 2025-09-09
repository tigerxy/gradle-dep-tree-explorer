// Basic test setup: reset localStorage and DOM between tests
import { beforeEach } from "vitest";

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {}
  // Ensure a container exists for Svelte mounts
  let app = document.getElementById("app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
  } else {
    app.innerHTML = "";
  }
});
