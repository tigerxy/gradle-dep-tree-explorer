# Gradle Dependency Tree Explorer — Svelte

This is a Svelte + Vite + TypeScript rewrite of the single-file app `gradle_dependency_tree_explorer.html`.

It preserves the same features and pages:

- Input: paste/upload old & current Gradle dependency trees; one-click samples.
- Diff Tree: collapsible tree with added/removed/changed markers, favorites, parent jumps, search.
- Updates: shows forced updates or all dependencies, with paths and jump-to-tree.
- Graph: interactive D3 tree with pan/zoom, fit, and jump to Diff Tree.

## Getting Started

1. Install dependencies:

   `npm install`

2. Start dev server:

   `npm run dev`

   Open the printed local URL.

3. Build for production:

   `npm run build`

   Preview the build locally:

   `npm run preview`

4. Run tests:

   `npm run test`

## Notes

- Bulma styles are imported via `src/app.css`.
- TypeScript types live in `src/lib/types.ts`; all modules and Svelte components use `lang="ts"`.
- D3 is imported as a module in `src/pages/GraphPage.svelte`.
- Favorites persist in `localStorage` under the key `depFavorites`.
- The app uses hash-based routing (no backend required).
