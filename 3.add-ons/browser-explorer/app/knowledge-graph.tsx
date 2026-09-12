"use client";

import { recordHref } from "../offline/links.mjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { headingDefinition, uniqueHeadingId } from "./markdown-parser";
import type { GraphData } from "./graph-types";
import { themePalette } from "./graph-presentation";
import { useGraphRenderer } from "./use-graph-renderer";

export type { GraphNode, GraphEdge, GraphData } from "./graph-types";

function readableDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function KnowledgeGraph({
  graph,
  loading = false,
}: {
  graph: GraphData;
  loading?: boolean;
}) {
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [automaticMobileDetails, setAutomaticMobileDetails] = useState(false);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const selectNode = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
    setSelectionVersion((version) => version + 1);
  }, []);
  const [collection, setCollection] = useState("all");
  const [localOnly, setLocalOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const initializeLegend = useCallback((legend: HTMLDetailsElement | null) => {
    if (legend) legend.open = !window.matchMedia("(max-width: 680px)").matches;
  }, []);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const collections = useMemo(
    () =>
      graph.nodes
        .filter((node) => node.kind === "collection")
        .map((node) => ({ value: node.collection, label: node.title }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [graph.nodes],
  );
  const themeColours = useMemo(
    () =>
      new Map(
        graph.themes.map((theme, index) => [
          theme.id,
          themePalette[index % themePalette.length],
        ]),
      ),
    [graph.themes],
  );
  const themeNames = useMemo(
    () => new Map(graph.themes.map((theme) => [theme.id, theme.title])),
    [graph.themes],
  );
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null;
  const neighbours = useMemo(
    () =>
      new Set(
        graph.edges.flatMap((edge) =>
          edge.source === selectedId
            ? [edge.target]
            : edge.target === selectedId
              ? [edge.source]
              : [],
        ),
      ),
    [graph.edges, selectedId],
  );
  const associatedFiles = useMemo(() => {
    if (!selected) return [];
    const ids = new Set([selected.id, ...neighbours]);
    return graph.nodes
      .filter((node) => ids.has(node.id) && node.path)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [graph.nodes, neighbours, selected]);
  const selectedSections = useMemo(() => {
    const used = new Set<string>();
    return (selected?.headings || []).map((source) => {
      const { text: heading, base } = headingDefinition(source);
      return { heading, id: uniqueHeadingId(base, used) };
    });
  }, [selected]);
  const term = query.trim().toLowerCase();
  const visibleIds = useMemo(
    () =>
      new Set(
        graph.nodes
          .filter(
            (node) =>
              (collection === "all" || node.collection === collection) &&
              (!term ||
                `${node.title} ${node.excerpt} ${node.headings.join(" ")}`
                  .toLowerCase()
                  .includes(term)),
          )
          .map((node) => node.id),
      ),
    [collection, graph.nodes, term],
  );
  const interactiveIds = useMemo(
    () =>
      new Set(
        [...visibleIds].filter(
          (id) =>
            !localOnly ||
            !selectedId ||
            id === selectedId ||
            neighbours.has(id),
        ),
      ),
    [localOnly, neighbours, selectedId, visibleIds],
  );

  const { containerRef, cyRef, arrangeGraph, zoomBy, fitGraph, keyboardMove } =
    useGraphRenderer({
      graph,
      themeColours,
      visibleIds,
      interactiveIds,
      selectedId,
      keyboardFocusId,
      selectNode,
    });

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 680px)");
    const closeOnDesktop = () => {
      if (!mobile.matches) mobileDialogRef.current?.close();
    };
    mobile.addEventListener("change", closeOnDesktop);
    return () => mobile.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!selected) mobileDialogRef.current?.close();
  }, [selected]);
  // Closing the dialog keeps the mode enabled; only the information toggle
  // disables it. A new selection (including the same node) opens fresh details.
  useEffect(() => {
    if (
      automaticMobileDetails &&
      selectedId &&
      window.matchMedia("(max-width: 680px)").matches
    ) {
      mobileDialogRef.current?.showModal();
    }
  }, [automaticMobileDetails, selectedId, selectionVersion]);

  const nodeDetails = selected ? (
    <>
      <div className="detail-kind">
        <span />
        {selected.kind}
      </div>
      <h3>{selected.title}</h3>
      <p>{selected.excerpt || "No summary is available for this record."}</p>
      {Object.keys(selected.details).length > 0 && (
        <dl className="detail-metadata">
          {selected.details.effectiveDate && (
            <div>
              <dt>Effective</dt>
              <dd>{readableDate(selected.details.effectiveDate)}</dd>
            </div>
          )}
          {selected.details.lastConfirmedDate && (
            <div>
              <dt>Last confirmed</dt>
              <dd>{readableDate(selected.details.lastConfirmedDate)}</dd>
            </div>
          )}
          {selected.details.source && (
            <div>
              <dt>Source</dt>
              <dd>{selected.details.source}</dd>
            </div>
          )}
        </dl>
      )}
      <dl className="detail-stats">
        <div>
          <dt>Collection</dt>
          <dd>{selected.collection}</dd>
        </div>
        <div>
          <dt>Connections</dt>
          <dd>{neighbours.size}</dd>
        </div>
        <div>
          <dt>Current state</dt>
          <dd>{selected.stateCount}</dd>
        </div>
        <div>
          <dt>Events</dt>
          <dd>{selected.eventCount}</dd>
        </div>
      </dl>
      <div className="detail-themes">
        <span>Linked Core themes</span>
        {selected.themeIds.length ? (
          selected.themeIds.map((id) => (
            <small key={id}>
              <i style={{ background: themeColours.get(id) }} />
              {themeNames.get(id)}
            </small>
          ))
        ) : (
          <p>None. Colours appear only for reciprocal Markdown links.</p>
        )}
      </div>
      {selectedSections.length > 0 && (
        <div className="detail-sections">
          <span>Sections</span>
          {selectedSections.map(({ heading, id }) => (
            <a key={id} href={recordHref(selected.path, id)}>
              {heading}
            </a>
          ))}
        </div>
      )}
      <div className="detail-files">
        <span>Associated Markdown files</span>
        {associatedFiles.length ? (
          associatedFiles.map((file) => (
            <a
              key={file.path}
              href={recordHref(file.path)}
              target="_blank"
              rel="noreferrer"
            >
              {file.title}
              <span>
                {"View "}
                <i
                  className="fa-solid fa-arrow-up-right-from-square"
                  aria-hidden="true"
                />
              </span>
            </a>
          ))
        ) : (
          <p>No Markdown files are associated with this node.</p>
        )}
      </div>
    </>
  ) : null;

  return (
    <section
      className={`graph-workspace ${detailOpen ? "" : "detail-collapsed"}`}
    >
      <div className="graph-stage-wrap">
        <div className="graph-stage">
          <div className="graph-controls">
            <select
              aria-label="Filter by collection"
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            >
              <option value="all">All collections</option>
              {collections.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label>
              <span className="sr-only">Search all records</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records and concepts"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <span className="search-clear-icon" aria-hidden="true" />
                </button>
              )}
            </label>
          </div>
          <div className="graph-actions">
            <button onClick={() => zoomBy(0.15)} aria-label="Zoom in">
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
            <button onClick={() => zoomBy(-0.15)} aria-label="Zoom out">
              <i className="fa-solid fa-minus" aria-hidden="true" />
            </button>
            <button onClick={fitGraph} aria-label="Fit graph" title="Fit graph">
              <i className="fa-solid fa-compress" aria-hidden="true" />
            </button>
            <button
              onClick={arrangeGraph}
              aria-label="Arrange graph"
              title="Arrange graph"
            >
              <i
                className="fa-solid fa-wand-magic-sparkles"
                aria-hidden="true"
              />
            </button>
            {selected && (
              <>
                <button
                  className="mobile-node-action"
                  type="button"
                  onClick={() => setAutomaticMobileDetails((value) => !value)}
                  aria-pressed={automaticMobileDetails}
                  aria-label="Node information"
                  title={
                    automaticMobileDetails
                      ? "Turn off automatic node information"
                      : "Turn on automatic node information"
                  }
                  aria-haspopup="dialog"
                  aria-controls="mobile-node-information"
                >
                  <i
                    key={selectionVersion}
                    className="fa-solid fa-circle-info"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className="mobile-node-action"
                  type="button"
                  onClick={() => setLocalOnly((value) => !value)}
                  aria-label={
                    localOnly ? "Show full graph" : "Focus on neighbours"
                  }
                  title={localOnly ? "Show full graph" : "Focus on neighbours"}
                  aria-pressed={localOnly}
                >
                  <i
                    key={selectionVersion}
                    className="fa-solid fa-share-nodes"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>
          <div
            ref={containerRef}
            className="cytoscape-graph"
            role="img"
            aria-label={`Knowledge graph with ${visibleIds.size} visible nodes`}
          />
          <div
            className="graph-keyboard-nodes"
            aria-label="Keyboard-accessible graph nodes"
          >
            {graph.nodes
              .filter((node) => interactiveIds.has(node.id))
              .map((node) => (
                <button
                  key={node.id}
                  aria-label={`${node.title}. ${node.themeIds.length ? `Themes: ${node.themeIds.map((id) => themeNames.get(id)).join(", ")}` : "No linked theme"}. Use arrow keys to move.`}
                  aria-pressed={node.id === selectedId}
                  onFocus={() => setKeyboardFocusId(node.id)}
                  onBlur={() => setKeyboardFocusId(null)}
                  onClick={() => selectNode(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectNode(node.id);
                    } else if (
                      [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      const cyNode = cyRef.current?.getElementById(node.id);
                      if (cyNode?.isNode())
                        keyboardMove(cyNode, event.key, event.shiftKey);
                    }
                  }}
                >
                  {node.title}
                </button>
              ))}
          </div>
          {loading && (
            <div className="graph-zero">
              <strong>Mapping your records…</strong>
            </div>
          )}
          {!loading && !visibleIds.size && (
            <div className="graph-zero">
              <strong>No matching records</strong>
              <span>Try a different search or collection.</span>
            </div>
          )}
          <details className="graph-legend" ref={initializeLegend}>
            <summary>Legend</summary>
            <div className="graph-legend-content">
              <span>
                <i className="legend-record" />
                Record · fill shows linked theme
              </span>
              <span>
                <i className="legend-theme" />
                Theme
              </span>
              <span>
                <i className="legend-collection" />
                Collection
              </span>
              <span>
                <i className="legend-reference" />
                Explicit Markdown link
              </span>
              {graph.themes.map((item) => (
                <span key={item.id}>
                  <i style={{ background: themeColours.get(item.id) }} />
                  {item.title}
                </span>
              ))}
            </div>
          </details>
        </div>
        <aside
          id="graph-node-details"
          aria-label="Node details"
          className="graph-detail"
          aria-live="polite"
        >
          <div className="detail-panel-header">
            <button
              className="panel-toggle detail-toggle"
              type="button"
              onClick={() => setDetailOpen((open) => !open)}
              aria-label={
                detailOpen
                  ? "Collapse node information panel"
                  : "Expand node information panel"
              }
              aria-expanded={detailOpen}
            >
              <i
                className={`fa-solid ${detailOpen ? "fa-chevron-right" : "fa-chevron-left"}`}
                aria-hidden="true"
              />
            </button>
            <span>{detailOpen ? "Hide details" : "Show details"}</span>
          </div>
          <div className="detail-content">
            {selected ? (
              <>
                <button
                  className={localOnly ? "active" : ""}
                  onClick={() => setLocalOnly((value) => !value)}
                >
                  {localOnly ? "Show full graph" : "Focus on neighbours"}
                </button>
                {nodeDetails}
              </>
            ) : (
              <div className="detail-empty">
                <span>
                  <i className="fa-solid fa-arrow-pointer" aria-hidden="true" />
                </span>
                <h3>Select a node</h3>
                <p>
                  Click or press Enter to inspect it. Drag to arrange; arrow
                  keys move a focused node.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
      <dialog
        ref={mobileDialogRef}
        id="mobile-node-information"
        className="mobile-node-dialog"
        aria-label="Node information"
      >
        <div className="mobile-dialog-header">
          <span>Node information</span>
          <button
            type="button"
            onClick={() => mobileDialogRef.current?.close()}
            aria-label="Close node information"
            autoFocus
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="detail-content">{nodeDetails}</div>
      </dialog>
    </section>
  );
}
