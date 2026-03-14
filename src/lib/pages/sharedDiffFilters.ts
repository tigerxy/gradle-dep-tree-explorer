export type SharedDiffFilterId = "added" | "removed" | "changed" | "unchanged" | "favorites";

export interface SharedDiffFilters {
  added: boolean;
  removed: boolean;
  changed: boolean;
  unchanged: boolean;
  favorites: boolean;
}

export const defaultSharedDiffFilters: SharedDiffFilters = {
  added: false,
  removed: false,
  changed: false,
  unchanged: false,
  favorites: false,
};
