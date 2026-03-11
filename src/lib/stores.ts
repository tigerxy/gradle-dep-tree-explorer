import { writable, type Writable } from "svelte/store";
import { buildAnalysis } from "./analysis/buildAnalysis";
import { collectAllNodeIds } from "./tree/descendants";
import type { DependencyNode, DiffNode, ForcedUpdateInfo, Route } from "./types";

interface AppState {
  oldText: string;
  newText: string;
  oldRoot: DependencyNode | null;
  newRoot: DependencyNode | null;
  mergedRoot: DiffNode | null;
  diffAvailable: boolean;
  favorites: Set<string>;
  searchQuery: string;
  nodeIndexByGA: Map<string, DependencyNode[]>;
  gaToPaths: Map<string, Set<string>>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  parentIdsById: Map<string, string>;
}

function createState() {
  const initial: AppState = {
    oldText: "",
    newText: "",
    oldRoot: null,
    newRoot: null,
    mergedRoot: null,
    diffAvailable: false,
    favorites: new Set<string>(JSON.parse(localStorage.getItem("depFavorites") || "[]")),
    searchQuery: "",
    nodeIndexByGA: new Map<string, DependencyNode[]>(),
    gaToPaths: new Map<string, Set<string>>(),
    forcedUpdates: new Map<string, ForcedUpdateInfo>(),
    parentIdsById: new Map<string, string>(),
  };
  const { subscribe, set, update } = writable<AppState>(initial);

  function setSearchQuery(q: string) {
    update((s) => ({ ...s, searchQuery: (q || "").trim() }));
  }

  function toggleFavorite(ga: string) {
    update((s) => {
      const fav = new Set(s.favorites);
      if (fav.has(ga)) fav.delete(ga);
      else fav.add(ga);
      localStorage.setItem("depFavorites", JSON.stringify(Array.from(fav)));
      return { ...s, favorites: fav };
    });
  }

  function parseAndBuild() {
    update((s) => {
      if (!s.newText || !s.newText.trim()) return s;
      return {
        ...s,
        ...buildAnalysis({
          oldText: s.oldText,
          newText: s.newText,
        }),
      };
    });
  }

  function setTexts({ oldText, newText }: { oldText?: string; newText?: string }) {
    update((s) => ({ ...s, oldText: oldText ?? s.oldText, newText: newText ?? s.newText }));
  }

  return { subscribe, set, update, setSearchQuery, toggleFavorite, parseAndBuild, setTexts };
}

export const state = createState();

// UI stores
export const route: Writable<Route> = writable<Route>("input");
export const updatesShowAll: Writable<boolean> = writable(false);
export const graphHideNonMatches: Writable<boolean> = writable(false);

// Expanded nodes: use a Set of node ids
export interface ExpansionStore {
  subscribe: Writable<Set<string>>["subscribe"];
  reset: (root: DiffNode | null) => void;
  expandAll: (root: DiffNode | null) => void;
  collapseAll: (root: DiffNode | null) => void;
  toggle: (id: string) => void;
  set: Writable<Set<string>>["set"];
}

function createExpansion(): ExpansionStore {
  const { subscribe, set, update } = writable<Set<string>>(new Set());
  return {
    subscribe,
    reset(root: DiffNode | null) {
      set(new Set(root ? [root.id] : []));
    },
    expandAll(root: DiffNode | null) {
      set(root ? collectAllNodeIds(root) : new Set());
    },
    collapseAll(root: DiffNode | null) {
      set(root ? new Set([root.id]) : new Set());
    },
    toggle(id: string) {
      update((set0) => {
        const s = new Set(set0);
        if (s.has(id)) {
          s.delete(id);
        } else {
          s.add(id);
        }
        return s;
      });
    },
    set,
  };
}

export const expanded: ExpansionStore = createExpansion();
