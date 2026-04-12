export interface UpdatePathItem {
  path: string;
  canJump: boolean;
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
