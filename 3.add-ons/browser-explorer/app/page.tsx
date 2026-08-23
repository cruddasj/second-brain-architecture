"use client";

import { useEffect, useState } from "react";
import ApplicationShell from "./application-shell";
import type { BrainData } from "./brain-data";
import { brainDataPath } from "./data-source";
import KnowledgeGraph, { type GraphData } from "./knowledge-graph";

const emptyGraph: GraphData = { nodes: [], edges: [], themes: [] };

export default function Home() {
  const [graph, setGraph] = useState(emptyGraph);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    fetch(brainDataPath).then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    }).then((data: BrainData) => { setGraph(data.graph); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  return <ApplicationShell>
      {status === "error" ? <section className="load-state"><h2>Graph unavailable</h2><p>Rebuild the browser data, then refresh this page.</p></section> : <KnowledgeGraph graph={graph} loading={status === "loading"} />}
  </ApplicationShell>;
}
