# Large Tree Benchmarks

Run:

```bash
npm run benchmark:large
```

The benchmark suite uses synthetic diff trees at 1k, 5k, and 25k nodes and times:

- `flattenTreePreorder`
- `buildSearchMatchIndex`
- `computeVisibleNodeIndex`
- `createDiffTreePageModel`

The output is copy-paste friendly `vitest bench` timing data and is intended for before/after comparisons during performance work.

## Search Index Decision

A trie or prefix index is not enabled by default.

Reasons:

- Current search semantics are substring-based across dependency name and version fields, not prefix-only.
- The existing linear scan is simple, deterministic, and already benchmarkable through `buildSearchMatchIndex`.
- Adding a trie would increase memory and implementation complexity while only helping a narrower prefix-search case.

Revisit that decision only if `npm run benchmark:large` shows search becoming the dominant bottleneck for real workloads and the product semantics are narrowed to prefix-style matching.
