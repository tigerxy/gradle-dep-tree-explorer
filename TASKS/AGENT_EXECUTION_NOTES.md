# Agent Execution Notes

This task pack is intended for LLM agents.

## Preferred workflow

For each task:

1. Read `0_OVERVIEW.md`
2. Read the selected task file
3. Inspect only the files relevant to that task
4. Make a minimal implementation
5. Run tests and linting
6. Summarize:
   - files changed
   - algorithm introduced
   - complexity impact
   - remaining risks

## Constraints

- Keep public behavior stable unless the task explicitly changes it
- Prefer measurable performance improvements over abstract refactors
- Prefer deterministic data structures
- Avoid introducing framework-heavy abstractions
- Create a git commit immediately after each completed task

## Reporting format

For each completed task, provide:
- What changed
- Why the algorithm is faster
- Big-O change if known
- Benchmark or test evidence
