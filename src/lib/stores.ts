import { get, writable, type Writable } from "svelte/store";
import { buildAnalysis } from "./analysis/buildAnalysis";
import {
  defaultSharedDiffFilters,
  type SharedDiffFilterId,
  type SharedDiffFilters,
} from "./pages/sharedDiffFilters";
import { collectAllNodeIds } from "./tree/descendants";
import type { FlattenedTree } from "./tree/flatten";
import type {
  AnalysisIssue,
  AnalysisStatus,
  DependencyNode,
  DiffNode,
  ForcedUpdateInfo,
  ParseDiagnostic,
  Route,
} from "./types";

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
  activeTreeIndex?: FlattenedTree<DiffNode> | null;
  gaToPaths: Map<string, Set<string>>;
  forcedUpdates: Map<string, ForcedUpdateInfo>;
  parentIdsById: Map<string, string>;
  oldParseDiagnostics: ParseDiagnostic[];
  newParseDiagnostics: ParseDiagnostic[];
  analysisStatus: AnalysisStatus | null;
  analysisIssues: AnalysisIssue[];
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
    activeTreeIndex: null,
    gaToPaths: new Map<string, Set<string>>(),
    forcedUpdates: new Map<string, ForcedUpdateInfo>(),
    parentIdsById: new Map<string, string>(),
    oldParseDiagnostics: [],
    newParseDiagnostics: [],
    analysisStatus: null,
    analysisIssues: [],
  };
  const store = writable<AppState>(initial);
  const { subscribe, set, update } = store;

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
    const current = get(store);
    const result = buildAnalysis({
      oldText: current.oldText,
      newText: current.newText,
    });

    set({
      ...current,
      oldRoot: result.oldRoot,
      newRoot: result.newRoot,
      mergedRoot: result.mergedRoot,
      diffAvailable: result.diffAvailable,
      nodeIndexByGA: result.nodeIndexByGA,
      activeTreeIndex: result.activeTreeIndex,
      gaToPaths: result.gaToPaths,
      forcedUpdates: result.forcedUpdates,
      parentIdsById: result.parentIdsById,
      oldParseDiagnostics: result.oldParseDiagnostics,
      newParseDiagnostics: result.newParseDiagnostics,
      analysisStatus: result.status,
      analysisIssues: result.issues,
    });

    return result;
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

export interface SharedDiffFiltersStore {
  subscribe: Writable<SharedDiffFilters>["subscribe"];
  set: Writable<SharedDiffFilters>["set"];
  update: Writable<SharedDiffFilters>["update"];
  reset: () => void;
  setFilter: (id: SharedDiffFilterId, value: boolean) => void;
}

function createSharedDiffFilters(): SharedDiffFiltersStore {
  const { subscribe, set, update } = writable<SharedDiffFilters>({ ...defaultSharedDiffFilters });

  return {
    subscribe,
    set,
    update,
    reset() {
      set({ ...defaultSharedDiffFilters });
    },
    setFilter(id: SharedDiffFilterId, value: boolean) {
      update((filters) => ({ ...filters, [id]: value }));
    },
  };
}

export const sharedDiffFilters: SharedDiffFiltersStore = createSharedDiffFilters();

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
