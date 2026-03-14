export interface UpdatePathItem {
  path: string;
  canJump: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createUpdatePathItems(paths: string[]): UpdatePathItem[] {
  if (!paths.length) {
    return [{ path: "No dependency paths recorded.", canJump: false }];
  }

  return paths.map((path) => ({
    path,
    canJump: true,
  }));
}

export function buildUpdatePathItemsHtml(items: UpdatePathItem[]): string {
  return items
    .map(
      (item) =>
        `<li class="is-flex is-justify-content-space-between is-align-items-center">${escapeHtml(item.path)}&nbsp;<button class="button is-small is-light" data-path="${escapeHtml(item.path)}"${item.canJump ? "" : " disabled hidden"}><span class="icon"><i class="fa-solid fa-folder-tree"></i></span><span>Diff Tree</span></button></li>`,
    )
    .join("");
}
