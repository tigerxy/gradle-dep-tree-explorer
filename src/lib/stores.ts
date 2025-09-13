import { writable, type Writable } from "svelte/store";
import {
  parseGradleTree,
  indexNodes,
  computeForcedUpdates,
  computeDiff,
  collectAllNodeIds,
} from "./logic";
import type { DepNode, ForcedUpdateInfo, Route } from "./types";

interface AppState {
  oldText: string;
  newText: string;
  oldRoot: DepNode | null;
  newRoot: DepNode | null;
  mergedRoot: DepNode | null;
  diffAvailable: boolean;
  favorites: Set<string>;
  searchQuery: string;
  nodeIndexByGA: Map<string, DepNode[]>;
  gaToPaths: Map<string, Set<string>>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
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
    nodeIndexByGA: new Map<string, DepNode[]>(),
    gaToPaths: new Map<string, Set<string>>(),
    forcedUpdates: new Map<string, ForcedUpdateInfo>(),
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
      const oldRoot = s.oldText && s.oldText.trim() ? parseGradleTree(s.oldText.trim()) : null;
      const newRoot = parseGradleTree(s.newText.trim());
      const diffAvailable = !!oldRoot;
      const mergedRoot = diffAvailable ? computeDiff(oldRoot!, newRoot).mergedRoot : newRoot;
      const { nodeIndexByGA } = indexNodes(newRoot);
      const { forcedUpdates, gaToPaths } = computeForcedUpdates(newRoot);
      return {
        ...s,
        oldRoot,
        newRoot,
        mergedRoot,
        diffAvailable,
        nodeIndexByGA,
        forcedUpdates,
        gaToPaths,
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
  reset: (root: DepNode | null) => void;
  expandAll: (root: DepNode | null) => void;
  collapseAll: (root: DepNode | null) => void;
  toggle: (id: string) => void;
  set: Writable<Set<string>>["set"];
}

function createExpansion(): ExpansionStore {
  const { subscribe, set, update } = writable<Set<string>>(new Set());
  return {
    subscribe,
    reset(root: DepNode | null) {
      set(new Set(root ? [root.id] : []));
    },
    expandAll(root: DepNode | null) {
      set(root ? collectAllNodeIds(root) : new Set());
    },
    collapseAll(root: DepNode | null) {
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
