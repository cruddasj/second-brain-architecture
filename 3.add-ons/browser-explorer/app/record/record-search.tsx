"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import MarkdownContent from "../records/[...path]/markdown-content";
import { clearMatchHighlights, findRenderedMatches, scrollToMatch, showMatchHighlights } from "./text-matches.mjs";

type SearchResult = { query: string; markdown: string; ranges: Range[]; active: number };

// Native range styles bypass the build-time CSS parser, which does not yet
// recognise ::highlight despite the browsers supporting it.
const highlightStyles = `
::highlight(record-search-matches) { background-color: #655316; color: #fff4ca; }
::highlight(record-search-active) { background-color: #f5c451; color: #1b1509; text-decoration: underline; }
`;

export default function RecordSearch({ markdown, resolveLink, children }: {
  markdown: string;
  resolveLink: (href: string) => string | undefined;
  children: (content: ReactNode) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult>({ query: "", markdown, ranges: [], active: 0 });
  const content = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const current = result.query === query && result.markdown === markdown;
  const count = current ? result.ranges.length : 0;

  useEffect(() => {
    const root = content.current;
    const bar = toolbar.current;
    if (!root || !bar) return;
    const timer = window.setTimeout(() => {
      const ranges = findRenderedMatches(root, query);
      showMatchHighlights(root, ranges, 0);
      setResult({ query, markdown, ranges, active: 0 });
      if (ranges.length) scrollToMatch(root, bar, ranges[0]);
    }, query.trim() ? 150 : 0);
    return () => { window.clearTimeout(timer); clearMatchHighlights(root); };
  }, [query, markdown]);

  function move(direction: number) {
    if (!count || !content.current || !toolbar.current) return;
    const active = (result.active + direction + count) % count;
    showMatchHighlights(content.current, result.ranges, active);
    scrollToMatch(content.current, toolbar.current, result.ranges[active]);
    setResult({ ...result, active });
  }

  return <div className="record-search">
    <style>{highlightStyles}</style>
    <div className="record-search-bar" role="search" aria-label="Search this Markdown file" ref={toolbar}>
      <div className="record-search-input">
        <input type="search" ref={input} value={query} onChange={event => setQuery(event.target.value)} aria-label="Search within this file" aria-describedby={statusId} placeholder="Search in this file" onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); move(event.shiftKey ? -1 : 1); }
          if (event.key === "Escape") { event.preventDefault(); setQuery(""); }
        }} />
        {query && <button type="button" className="record-search-clear" aria-label="Clear file search" onClick={() => { setQuery(""); input.current?.focus(); }}><i className="fa-solid fa-xmark" aria-hidden="true" /></button>}
      </div>
      <div className="record-search-controls">
        <span className="record-search-status" id={statusId} role="status" aria-live="polite" aria-atomic="true">{!query.trim() ? "Search this file" : !current ? "Searching…" : count ? `${result.active + 1} of ${count} ${count === 1 ? "match" : "matches"}` : "No matches"}</span>
        <button type="button" aria-label="Previous match" title="Previous match (Shift+Enter)" disabled={!count} onClick={() => move(-1)}><i className="fa-solid fa-chevron-up" aria-hidden="true" /></button>
        <button type="button" aria-label="Next match" title="Next match (Enter)" disabled={!count} onClick={() => move(1)}><i className="fa-solid fa-chevron-down" aria-hidden="true" /></button>
      </div>
    </div>
    {children(<div ref={content}><MarkdownContent markdown={markdown} resolveLink={resolveLink} /></div>)}
  </div>;
}
