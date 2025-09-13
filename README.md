# Gradle Dependency Tree Explorer

Explore and diff Gradle dependency trees to quickly see what changed — what was added, removed, or updated — and why. Runs entirely in your browser, works offline, and never sends your data to any server.

Live Demo: https://tigerxy.github.io/gradle-dep-tree-explorer/

Download (single HTML): https://github.com/tigerxy/gradle-dep-tree-explorer/releases/latest

## Features

- Input: Paste or upload the "old" and "current" Gradle dependency trees; includes one‑click sample data and clear/reset.
- Diff Tree: Collapsible tree with added/removed/changed markers, favorites, parent jump, and text search with highlighting.
- Updates View: Shows forced updates or all dependency updates, with paths to the root and deep-link back to the Diff Tree.
- Graph View: Interactive D3 graph with expand/collapse, pan/zoom, fit‑to‑view, and jump back to the Diff Tree node.
- Single‑file build: Produces a standalone `index.html` that works offline (all JS/CSS/assets inlined).
- Client‑side only: Hash‑based routing; nothing is sent over the network.

## Privacy

- No data leaves your machine: All parsing, diffing, and visualization happen entirely in the browser.
- Works offline: The single‑file build runs without internet access.
- No telemetry: No analytics, tracking, or external calls — respects your privacy by design.

## When To Use It

Compare two Gradle dependency trees to quickly spot changes and their impact. Useful when:

- Upgrading Gradle: See how the dependency resolution changes across Gradle versions.
- Bumping libraries/plugins: Verify direct or transitive version updates and detect regressions.
- Changing dependency constraints: Inspect effects of BOMs, version catalogs, or forced versions.
- Resolving conflicts: Identify where version conflicts originate and which path introduced them.
- Reducing bloat: Find newly added heavy or duplicate transitive dependencies.
- Security fixes: Confirm vulnerable artifacts were removed or upgraded in the new tree.
- Repro/debug builds: Compare CI vs. local or branch vs. main to understand differences.

## Getting Started

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev` (open the printed local URL)
3. Build for production: `npm run build` and preview with `npm run preview`
4. Run tests: `npm run test`

## Releases & Pages

- The live demo is published at https://tigerxy.github.io/gradle-dep-tree-explorer/
- Deploys happen when a version tag is pushed (e.g. `v0.1.0`). One workflow builds once, then:
  - Deploys `dist/` to GitHub Pages
  - Creates a GitHub Release with assets:
    - `gradle-tree-explorer-vX.Y.Z.html` — single‑file app
    - `gradle-tree-explorer-vX.Y.Z.zip` — zipped `dist/` contents

## CI

- On push/PR to `main`: runs tests, checks formatting (Prettier), and lints (ESLint).
- On tags `v*`: builds, deploys Pages, and publishes the Release with download artifacts.

## Exporting Gradle Trees

- From the module you care about (example for Android app release runtime):
  `./gradlew :app:dependencies --configuration releaseRuntimeClasspath --refresh-dependencies > deps.txt`
- For diffs, generate two files (before/after your change) and paste/upload them in the app.

## Notes

- Bulma styles are imported via `src/app.css`.
- TypeScript types live in `src/lib/types.ts`; all modules and Svelte components use `lang="ts"`.
- D3 is imported as a module in `src/pages/GraphPage.svelte`.
- Favorites persist in `localStorage` under the key `depFavorites`.
- The app uses hash-based routing (no backend required).

## License

MIT License. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the terms in `LICENSE`. Provided "as is", without warranty of any kind. See `LICENSE` for full text.

## Contributing

Contributions are welcome! Please open issues for bugs and feature requests, and submit PRs for fixes or improvements.

- Run `npm ci && npm run format:check && npm test && npm run lint` before submitting.
- Keep changes focused; add tests when reasonable.
- If proposing UX changes, screenshots or short clips help a lot.
