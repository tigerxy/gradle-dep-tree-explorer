export { computeDiff, createUnchangedDiff } from "./analysis/diff";
export { computeForcedUpdates } from "./analysis/forcedUpdates";
export { indexNodes } from "./analysis/indexing";
export { parseGradleTree, parseGradleTreeWithDiagnostics } from "./parser/gradleTreeParser";
export { collectAllNodeIds, computeDescendantCounts } from "./tree/descendants";
export {
  flattenTreePreorder,
  type FlattenedTree,
  getChildIndexes,
  getSubtreeIndexes,
  isIndexInSubtree,
} from "./tree/flatten";
export { buildParentIdsById, buildParentIdsByIdFromFlattened, findParentId } from "./tree/parents";
export { findNodeByPath, hasMatchOrDesc } from "./tree/navigation";
export { buildSearchMatchIndex } from "./tree/search";
