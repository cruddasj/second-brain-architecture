export type GraphNode = {
  id: string;
  title: string;
  kind: string;
  collection: string;
  path: string;
  excerpt: string;
  details: {
    effectiveDate?: string;
    lastConfirmedDate?: string;
    source?: string;
  };
  headings: string[];
  stateCount: number;
  eventCount: number;
  themeIds: string[];
};
export type GraphEdge = {
  source: string;
  target: string;
  kind: "collection" | "reference";
};
export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  themes: { id: string; title: string }[];
};

export type Point = { x: number; y: number };
