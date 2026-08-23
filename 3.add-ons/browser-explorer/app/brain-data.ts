import type { GraphData } from "./knowledge-graph";

export type MarkdownFile = {
  path: string;
  title: string;
  filename: string;
  folders: string[];
};

export type BrainData = {
  schemaVersion: number;
  source: string;
  graph: GraphData;
  markdown: { files: MarkdownFile[] };
};
