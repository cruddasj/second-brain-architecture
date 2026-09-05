"use client";

import cytoscape, { type Core, type ElementDefinition, type NodeSingular } from "cytoscape";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { headingDefinition, uniqueHeadingId } from "./records/[...path]/markdown-content";

export type GraphNode = { id: string; title: string; kind: string; collection: string; path: string; excerpt: string; details: { effectiveDate?: string; lastConfirmedDate?: string; source?: string }; headings: string[]; stateCount: number; eventCount: number; themeIds: string[] };
export type GraphEdge = { source: string; target: string; kind: "collection" | "reference" };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[]; themes: { id: string; title: string }[] };

type Point = { x: number; y: number };
const themePalette = ["#2f7fc1", "#20a7c9", "#35b8b4", "#66b99a", "#91bd78", "#c4c966", "#e1c84f"];
const unthemedColour = "#f4f1ef";
const storageKey = "second-brain-graph-positions-v1";
const minZoom = .25;
const maxZoom = 1.6;
const fitPadding = 72;

// Transparent lighting preserves the existing theme colours, including pie slices.
const nodeLighting = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><radialGradient id="light" cx="32%" cy="25%" r="78%"><stop offset="0" stop-color="white" stop-opacity=".28"/><stop offset=".45" stop-color="white" stop-opacity=".03"/><stop offset="1" stop-color="black" stop-opacity=".28"/></radialGradient></defs><rect width="100" height="100" fill="url(#light)"/></svg>')}`;

function readableDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function loadPositions(): Record<string, Point> {
  try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
}

export default function KnowledgeGraph({ graph, loading = false }: { graph: GraphData; loading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const hasInitialFitRef = useRef(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collection, setCollection] = useState("all");
  const [localOnly, setLocalOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const collections = useMemo(() => graph.nodes
    .filter((node) => node.kind === "collection")
    .map((node) => ({ value: node.collection, label: node.title }))
    .sort((left, right) => left.label.localeCompare(right.label)), [graph.nodes]);
  const themeColours = useMemo(() => new Map(graph.themes.map((theme, index) => [theme.id, themePalette[index % themePalette.length]])), [graph.themes]);
  const themeNames = useMemo(() => new Map(graph.themes.map((theme) => [theme.id, theme.title])), [graph.themes]);
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const neighbours = useMemo(() => new Set(graph.edges.flatMap((edge) => edge.source === selectedId ? [edge.target] : edge.target === selectedId ? [edge.source] : [])), [graph.edges, selectedId]);
  const associatedFiles = useMemo(() => {
    if (!selected) return [];
    const ids = new Set([selected.id, ...neighbours]);
    return graph.nodes.filter((node) => ids.has(node.id) && node.path).sort((a, b) => a.title.localeCompare(b.title));
  }, [graph.nodes, neighbours, selected]);
  const selectedSections = useMemo(() => {
    const used = new Set<string>();
    return (selected?.headings || []).map((source) => {
      const { text: heading, base } = headingDefinition(source);
      return { heading, id: uniqueHeadingId(base, used) };
    });
  }, [selected]);
  const term = query.trim().toLowerCase();
  const visibleIds = useMemo(() => new Set(graph.nodes.filter((node) => (collection === "all" || node.collection === collection) && (!term || `${node.title} ${node.excerpt} ${node.headings.join(" ")}`.toLowerCase().includes(term))).map((node) => node.id)), [collection, graph.nodes, term]);
  const interactiveIds = useMemo(() => new Set([...visibleIds].filter((id) => !localOnly || !selectedId || id === selectedId || neighbours.has(id))), [localOnly, neighbours, selectedId, visibleIds]);

  const arrangeGraph = useCallback(() => {
    const cy = cyRef.current; if (!cy) return;
    const visibleNodes = cy.nodes(":visible"); if (!visibleNodes.length) return;
    const visibleElements = visibleNodes.union(cy.edges(":visible"));
    const layout = visibleElements.layout({
      name: "cose",
      nodeRepulsion: 12000,
      idealEdgeLength: 150,
      nodeOverlap: 32,
      gravity: .18,
      padding: fitPadding,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      animationDuration: 650,
      fit: true,
      randomize: true,
    });
    layout.one("layoutstop", () => {
      const saved = loadPositions();
      visibleNodes.forEach((node) => { saved[node.id()] = node.position(); });
      localStorage.setItem(storageKey, JSON.stringify(saved));
      cy.fit(visibleNodes, fitPadding);
    });
    layout.run();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      layout: { name: "preset" },
      minZoom,
      maxZoom,
      panningEnabled: true,
      userPanningEnabled: true,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
      style: [
        { selector: "node", style: { width: 28, height: 28, shape: "ellipse", "background-color": unthemedColour, "background-opacity": .76, "border-color": "rgba(255,255,255,.7)", "border-width": 1.25, label: "data(shortLabel)", color: "rgba(255,255,255,.82)", "font-family": 'Roboto, "Segoe UI", Arial, sans-serif', "font-size": 11, "font-weight": 600, "text-valign": "bottom", "text-margin-y": 10, "text-outline-color": "#111416", "text-outline-width": 3, "text-wrap": "none", "overlay-opacity": 0, "transition-property": "opacity, border-color, border-width, underlay-opacity", "transition-duration": 450 } },
        { selector: "node.collection", style: { width: 58, height: 58, "background-color": unthemedColour, "border-color": "rgba(255,255,255,.72)", "border-width": 2, "font-size": 12 } },
        { selector: "node.theme", style: { width: 36, height: 36, shape: "diamond", "background-color": "#35b8b4", "border-color": "rgba(255,255,255,.8)", "border-width": 2 } },
        { selector: "node.themed", style: { "background-color": "data(themeColour)" } },
        { selector: "node", style: { "background-opacity": 1, "background-image": nodeLighting, "background-width": "100%", "background-height": "100%", "background-image-containment": "over", "background-clip": "node", "border-width": .75, "border-color": "#ffffff", "border-opacity": .24, "text-outline-width": 2, "font-weight": 400 } },
        { selector: "node.multi-theme", style: { "pie-size": "100%", "pie-1-background-color": "data(pie1)", "pie-1-background-size": "data(pieSize1)", "pie-2-background-color": "data(pie2)", "pie-2-background-size": "data(pieSize2)", "pie-3-background-color": "data(pie3)", "pie-3-background-size": "data(pieSize3)", "pie-4-background-color": "data(pie4)", "pie-4-background-size": "data(pieSize4)", "pie-5-background-color": "data(pie5)", "pie-5-background-size": "data(pieSize5)", "pie-6-background-color": "data(pie6)", "pie-6-background-size": "data(pieSize6)", "pie-7-background-color": "data(pie7)", "pie-7-background-size": "data(pieSize7)" } },
        { selector: "edge", style: { width: 1, "curve-style": "straight", "line-color": "data(edgeColour)", opacity: .32, "transition-property": "opacity", "transition-duration": 250 } },
        { selector: "edge.reference", style: { width: 1.1, opacity: .5, "line-style": "dashed" } },
        { selector: "edge.connected", style: { opacity: .8, width: 1.5 } },
        { selector: ".selected, .keyboard-focus", style: { "border-color": "#d9dde0", "border-opacity": .9, "border-width": 2, "underlay-color": "#d9dde0", "underlay-opacity": .12, "underlay-padding": 7, "underlay-shape": "ellipse" } },
        { selector: ".focus-hidden", style: { opacity: 0, events: "no" } },
      ] as unknown as cytoscape.StylesheetJson,
    });
    cy.on("tap", "node", (event) => { setSelectedId(event.target.id()); setDetailOpen(true); });
    cy.on("free", "node", (event) => {
      const positions = loadPositions();
      positions[event.target.id()] = event.target.position();
      localStorage.setItem(storageKey, JSON.stringify(positions));
    });
    const resizeObserver = new ResizeObserver(() => cy.resize());
    resizeObserver.observe(containerRef.current);
    cyRef.current = cy;
    return () => { resizeObserver.disconnect(); cyRef.current = null; cy.destroy(); };
  }, []);

  useEffect(() => {
    const cy = cyRef.current; if (!cy) return;
    const existing = Object.fromEntries(cy.nodes().map((node) => [node.id(), node.position()]));
    const saved = loadPositions();
    const hasSavedPositions = Object.keys(saved).length > 0;
    const elements: ElementDefinition[] = graph.nodes.map((node) => {
      const colours = node.themeIds.map((id) => themeColours.get(id) || themePalette[0]);
      const pieSize = colours.length ? 100 / colours.length : 0;
      return { group: "nodes", data: { ...node, shortLabel: node.title.length > 24 ? `${node.title.slice(0, 22)}…` : node.title, themeColour: colours[0] || unthemedColour, ...Object.fromEntries(themePalette.map((_, index) => [`pie${index + 1}`, colours[index] || "transparent"])), ...Object.fromEntries(themePalette.map((_, index) => [`pieSize${index + 1}`, colours[index] ? pieSize : 0])) }, classes: `${node.kind} ${colours.length ? "themed" : ""} ${colours.length > 1 ? "multi-theme" : ""}`, position: existing[node.id] || saved[node.id] || { x: 500, y: 360 } };
    });
    elements.push(...graph.edges.map((edge, index) => ({ group: "edges" as const, data: { id: `${edge.kind}:${edge.source}:${edge.target}:${index}`, ...edge, edgeColour: themeColours.get(graph.nodes.find((node) => node.id === (edge.kind === "reference" ? edge.target : edge.source))?.themeIds[0] || "") || "#9da4a7" }, classes: edge.kind })));
    cy.resize();
    cy.elements().remove(); cy.add(elements); cy.layout({ name: "preset", fit: false }).run();
    if (!hasInitialFitRef.current && cy.nodes().length) {
      hasInitialFitRef.current = true;
      if (hasSavedPositions) cy.fit(cy.nodes(":visible"), fitPadding);
      else arrangeGraph();
    }
  }, [arrangeGraph, graph.edges, graph.nodes, themeColours]);

  useEffect(() => {
    const cy = cyRef.current; if (!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((node) => { node.style("display", visibleIds.has(node.id()) ? "element" : "none"); node.toggleClass("selected", node.id() === selectedId); node.toggleClass("keyboard-focus", node.id() === keyboardFocusId); node.toggleClass("focus-hidden", !interactiveIds.has(node.id())); });
      cy.edges().forEach((edge) => { const visible = visibleIds.has(edge.source().id()) && visibleIds.has(edge.target().id()); edge.style("display", visible ? "element" : "none"); edge.toggleClass("connected", edge.source().id() === selectedId || edge.target().id() === selectedId || edge.source().id() === keyboardFocusId || edge.target().id() === keyboardFocusId); edge.toggleClass("focus-hidden", !interactiveIds.has(edge.source().id()) || !interactiveIds.has(edge.target().id())); });
    });
  }, [interactiveIds, keyboardFocusId, selectedId, visibleIds]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedId || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const startedAt = performance.now();
    const pulse = (now: number) => {
      const selectedNode = cy.getElementById(selectedId);
      if (selectedNode.length) {
        const progress = (Math.sin((now - startedAt) / 900) + 1) / 2;
        selectedNode.style({ "underlay-opacity": .09 + progress * .05, "underlay-padding": 6 + progress * 2 });
      }
      frame = requestAnimationFrame(pulse);
    };
    frame = requestAnimationFrame(pulse);
    return () => {
      cancelAnimationFrame(frame);
      const selectedNode = cy.getElementById(selectedId);
      if (selectedNode.length) selectedNode.removeStyle("underlay-opacity underlay-padding");
    };
  }, [selectedId]);

  const persistPosition = useCallback((id: string, point: Point) => {
    const node = cyRef.current?.getElementById(id); if (!node?.length) return;
    const bounded = { x: Math.max(35, Math.min(965, point.x)), y: Math.max(35, Math.min(685, point.y)) };
    node.position(bounded); const saved = loadPositions(); saved[id] = bounded; localStorage.setItem(storageKey, JSON.stringify(saved));
  }, []);
  function zoomBy(delta: number) { const cy = cyRef.current; if (!cy) return; cy.zoom({ level: Math.max(minZoom, Math.min(maxZoom, cy.zoom() + delta)), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); }
  function keyboardMove(node: NodeSingular, key: string, large: boolean) { const delta = large ? 20 : 5; const point = node.position(); persistPosition(node.id(), { x: point.x + (key === "ArrowLeft" ? -delta : key === "ArrowRight" ? delta : 0), y: point.y + (key === "ArrowUp" ? -delta : key === "ArrowDown" ? delta : 0) }); }

  return <section className={`graph-workspace ${detailOpen ? "" : "detail-collapsed"}`}>
    <div className="graph-stage-wrap"><div className="graph-stage">
      <div className="graph-controls"><select aria-label="Filter by collection" value={collection} onChange={(event) => setCollection(event.target.value)}><option value="all">All collections</option>{collections.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select><label><span className="sr-only">Search all records</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records and concepts" />{query && <button type="button" className="search-clear" onClick={() => setQuery("")} aria-label="Clear search" title="Clear search"><span className="search-clear-icon" aria-hidden="true" /></button>}</label></div>
      <div className="graph-actions"><button onClick={() => zoomBy(.15)} aria-label="Zoom in"><i className="fa-solid fa-plus" aria-hidden="true" /></button><button onClick={() => zoomBy(-.15)} aria-label="Zoom out"><i className="fa-solid fa-minus" aria-hidden="true" /></button><button onClick={arrangeGraph} aria-label="Arrange graph" title="Arrange graph"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /></button></div>
      <div ref={containerRef} className="cytoscape-graph" role="img" aria-label={`Knowledge graph with ${visibleIds.size} visible nodes`} />
      <div className="graph-keyboard-nodes" aria-label="Keyboard-accessible graph nodes">{graph.nodes.filter((node) => interactiveIds.has(node.id)).map((node) => <button key={node.id} aria-label={`${node.title}. ${node.themeIds.length ? `Themes: ${node.themeIds.map((id) => themeNames.get(id)).join(", ")}` : "No linked theme"}. Use arrow keys to move.`} aria-pressed={node.id === selectedId} onFocus={() => setKeyboardFocusId(node.id)} onBlur={() => setKeyboardFocusId(null)} onClick={() => setSelectedId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.id); } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const cyNode = cyRef.current?.getElementById(node.id); if (cyNode?.isNode()) keyboardMove(cyNode, event.key, event.shiftKey); } }}>{node.title}</button>)}</div>
      {loading && <div className="graph-zero"><strong>Mapping your records…</strong></div>}{!loading && !visibleIds.size && <div className="graph-zero"><strong>No matching records</strong><span>Try a different search or collection.</span></div>}
      <div className="graph-legend"><span><i className="legend-record" />Record · fill shows linked theme</span><span><i className="legend-theme" />Theme</span><span><i className="legend-collection" />Collection</span><span><i className="legend-reference" />Explicit Markdown link</span>{graph.themes.map((item) => <span key={item.id}><i style={{ background: themeColours.get(item.id) }} />{item.title}</span>)}</div>
    </div><aside className="graph-detail" aria-live="polite"><div className="detail-panel-header"><button className="panel-toggle detail-toggle" type="button" onClick={() => setDetailOpen((open) => !open)} aria-label={detailOpen ? "Collapse node information panel" : "Expand node information panel"} aria-expanded={detailOpen}><i className={`fa-solid ${detailOpen ? "fa-chevron-right" : "fa-chevron-left"}`} aria-hidden="true" /></button><span>{detailOpen ? "Hide details" : ""}</span></div><div className="detail-content">{selected ? <><button className={localOnly ? "active" : ""} onClick={() => setLocalOnly((value) => !value)}>{localOnly ? "Show full graph" : "Focus on neighbours"}</button><div className="detail-kind"><span />{selected.kind}</div><h3>{selected.title}</h3><p>{selected.excerpt || "No summary is available for this record."}</p>{Object.keys(selected.details).length > 0 && <dl className="detail-metadata">{selected.details.effectiveDate && <div><dt>Effective</dt><dd>{readableDate(selected.details.effectiveDate)}</dd></div>}{selected.details.lastConfirmedDate && <div><dt>Last confirmed</dt><dd>{readableDate(selected.details.lastConfirmedDate)}</dd></div>}{selected.details.source && <div><dt>Source</dt><dd>{selected.details.source}</dd></div>}</dl>}<dl className="detail-stats"><div><dt>Collection</dt><dd>{selected.collection}</dd></div><div><dt>Connections</dt><dd>{neighbours.size}</dd></div><div><dt>Current state</dt><dd>{selected.stateCount}</dd></div><div><dt>Events</dt><dd>{selected.eventCount}</dd></div></dl><div className="detail-themes"><span>Linked Core themes</span>{selected.themeIds.length ? selected.themeIds.map((id) => <small key={id}><i style={{ background: themeColours.get(id) }} />{themeNames.get(id)}</small>) : <p>None. Colours appear only for reciprocal Markdown links.</p>}</div>{selectedSections.length > 0 && <div className="detail-sections"><span>Sections</span>{selectedSections.map(({ heading, id }) => <a key={id} href={`/records/${selected.path.split("/").map(encodeURIComponent).join("/")}#${encodeURIComponent(id)}`}>{heading}</a>)}</div>}<div className="detail-files"><span>Associated Markdown files</span>{associatedFiles.length ? associatedFiles.map((file) => <a key={file.path} href={`/records/${file.path.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer">{file.title}<span>View <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></span></a>) : <p>No Markdown files are associated with this node.</p>}</div></> : <div className="detail-empty"><span><i className="fa-solid fa-arrow-pointer" aria-hidden="true" /></span><h3>Select a node</h3><p>Click or press Enter to inspect it. Drag to arrange; arrow keys move a focused node.</p></div>}</div></aside></div>
  </section>;
}
