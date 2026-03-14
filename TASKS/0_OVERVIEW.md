# Gradle Dependency Tree Explorer – Performance Tasks for Intelligent Tree Algorithms

This task pack is optimized for AI agents such as Codex.

The focus is **performance improvement using tree-aware algorithms and data-oriented structures**.
These tasks are designed to reduce repeated recursive traversals, improve diff scalability,
and prepare the app for very large dependency trees.

## Primary goals

- Reduce repeated subtree scans
- Replace recursive UI-time calculations with precomputed indexes
- Improve diff matching on repeated siblings
- Prepare the codebase for large trees (10k+ nodes)
- Make the analysis pipeline easier to move into a Web Worker

## Recommended execution order

Track progress through the numbered tasks with checkboxes:

- [x] `TASK_01_flatten_tree_representation.md` – Introduce a flattened tree representation
- [x] `TASK_02_add_subtree_intervals.md` – Add subtree interval indexing
- [ ] `TASK_03_add_node_array_indexes.md` – Add dense array-based node indexes
- [ ] `TASK_04_cache_parent_lookup.md` – Remove fallback recursive parent lookup
- [ ] `TASK_05_precompute_tree_search_matches.md` – Precompute search matches
- [ ] `TASK_06_precompute_search_match_index.md` – Precompute search match indexes
- [ ] `TASK_07_add_parser_fixture_tests.md` – Add parser fixture tests
- [ ] `TASK_08_precompute_visibility_index.md` – Precompute visible nodes for filters and search
- [ ] `TASK_09_remove_recursive_visibility_checks.md` – Remove recursive visibility checks from UI
- [ ] `TASK_10_replace_recursive_tree_render_checks.md` – Replace recursive render-time checks in TreeNode
- [ ] `TASK_11_extract_graph_render_pipeline.md` – Extract graph rendering pipeline
- [ ] `TASK_12_add_diff_matching_index.md` – Improve diff matching performance
- [ ] `TASK_13_add_bucketed_diff_matching.md` – Add bucketed diff matching for sibling comparison
- [ ] `TASK_14_add_graph_model_memoization.md` – Memoize graph model generation
- [ ] `TASK_15_split_graph_model_from_diff_model.md` – Separate graph model from diff model
- [ ] `TASK_16_prepare_bitset_filter_engine.md` – Prepare a bitset-based filter engine
- [ ] `TASK_17_prepare_web_worker_analysis.md` – Prepare Web Worker analysis
- [ ] `TASK_18_move_analysis_to_worker_ready_payloads.md` – Prepare worker-ready analysis payloads
- [ ] `TASK_19_remove_double_analysis.md` – Remove double analysis execution
- [ ] `TASK_20_add_large_tree_benchmarks.md` – Add large-tree performance benchmarks
- [ ] `TASK_21_optional_trie_for_dependency_search.md` – Optional trie or prefix index for dependency search

## Agent execution rules

For each task:

1. Read the full task file.
2. Make the minimal change required to satisfy the acceptance criteria.
3. Keep the public behavior unchanged unless explicitly required.
4. Add tests where appropriate.
5. Avoid introducing dead code or optional abstractions that are not yet used.
6. After implementation, update the task file status if your workflow supports it.
7. Create a git commit immediately after each completed task.

## Performance strategy

This task pack intentionally favors:

- flattened tree arrays
- subtree interval indexing
- precomputed visible-node sets
- cached selectors
- bucketed matching
- worker-friendly payloads

It intentionally does **not** prioritize B+ trees, because the current workload is dominated by
in-memory rooted-tree traversal and repeated subtree evaluation rather than ordered range lookup.
