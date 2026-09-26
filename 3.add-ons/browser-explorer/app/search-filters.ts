import type { MarkdownFile } from "./brain-data";
import type { GraphNode } from "./graph-types";

export function matchesMarkdownFile(file: MarkdownFile, query: string, contentPaths: ReadonlySet<string> = new Set()) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || contentPaths.has(file.path) || [file.filename, file.title, file.path].some((value) => value.toLocaleLowerCase().includes(needle));
}

export function matchesGraphNode(node: GraphNode, query: string, collection: string, contentPaths: ReadonlySet<string>) {
  const needle = query.trim().toLowerCase();
  return (collection === "all" || node.collection === collection) &&
    (!needle || contentPaths.has(node.path) || node.path.toLowerCase().includes(needle) ||
      `${node.title} ${node.excerpt} ${node.headings.join(" ")}`.toLowerCase().includes(needle));
}
