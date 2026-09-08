"use client";
import { appPath } from "../offline/paths.mjs";

import { useBrain } from "./brain-provider";
import ApplicationShell from "./application-shell";
import KnowledgeGraph from "./knowledge-graph";


export default function Home() {
  const { data, snapshot, loading, message } = useBrain();
  const graph = data.graph;
  const status = loading ? "loading" : message && !graph.nodes.length ? "error" : "ready";
  return <ApplicationShell>
      {!loading && !snapshot ? <section className="load-state"><h2>Connect your second brain</h2><p>{message || "Complete setup to bring your notes into the graph and reader."}</p><a className="setup-link" href={appPath("/connection/")}><i className="fa-solid fa-link" aria-hidden="true" /><span>Open setup</span></a></section> : status === "error" ? <section className="load-state"><h2>Graph unavailable</h2><p>Rebuild the browser data, then refresh this page.</p></section> : <KnowledgeGraph graph={graph} loading={status === "loading"} />}
  </ApplicationShell>;
}
