import type { RoadmapNode, RoadmapSection } from "./types";

type RoadmapSubtree = RoadmapNode | RoadmapSection;

function isOptional(node: RoadmapSubtree): boolean {
  return "optional" in node && node.optional === true;
}

export function isLeaf(node: RoadmapSubtree): boolean {
  return !node.children || node.children.length === 0;
}

export function requiredLeaves(node: RoadmapSubtree): RoadmapNode[] {
  if (isOptional(node)) return [];
  if (isLeaf(node)) {
    return node.children === undefined ? [node] : [];
  }
  return (node.children ?? []).flatMap(requiredLeaves);
}

export function nodeProgress(node: RoadmapSubtree, done: Set<string>): { done: number; total: number } {
  const leaves = requiredLeaves(node);
  const completed = leaves.filter((leaf) => done.has(leaf.id)).length;
  return { done: completed, total: leaves.length };
}

// Every leaf under a node, including optional ones. Display-only.
export function allLeaves(node: RoadmapSubtree): RoadmapNode[] {
  if (isLeaf(node)) {
    return node.children === undefined ? [node] : [];
  }
  return (node.children ?? []).flatMap(allLeaves);
}

// Progress used to drive the checkbox UI only. "Relevant" leaves are the
// required ones when the node has any, otherwise all leaves (so a fully
// optional group still rolls up). Section gating stays required-based.
export function displayProgress(
  node: RoadmapSubtree,
  done: Set<string>,
): { done: number; total: number } {
  const required = requiredLeaves(node);
  const relevant = required.length > 0 ? required : allLeaves(node);
  const completed = relevant.filter((leaf) => done.has(leaf.id)).length;
  return { done: completed, total: relevant.length };
}

export function isComplete(node: RoadmapSubtree, done: Set<string>): boolean {
  const { done: completed, total } = nodeProgress(node, done);
  return total > 0 && completed === total;
}

export function isSectionUnlocked(index: number, sections: RoadmapSection[], done: Set<string>): boolean {
  if (index === 0) return true;
  const prev = sections[index - 1];
  return isComplete(prev, done) || nodeProgress(prev, done).total === 0;
}

export function toggle(id: string, done: Set<string>): Set<string> {
  const next = new Set(done);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}
