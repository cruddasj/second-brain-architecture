"use client";
import { appPath } from "../../offline/paths.mjs";

import { type ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";
import { createWikilinkIndex } from "../../offline/markdown-links.mjs";
import ApplicationShell from "../application-shell";
import { useBrain } from "../brain-provider";
import { headingOutline } from "../records/[...path]/markdown-content";
import RecordSearch from "./record-search";
import TableOfContents from "../records/[...path]/table-of-contents";
import { readerLink } from "../../offline/links.mjs";

function recordPath() {
  return new URLSearchParams(window.location.search).get("file") || "";
}
function subscribeRecordPath(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}
const serverRecordPath = () => "";

export default function RecordPage() {
  const { snapshot, loading } = useBrain();
  const resolveWiki = useMemo(() => createWikilinkIndex(snapshot?.files || []), [snapshot]);
  const relativePath = useSyncExternalStore(subscribeRecordPath, recordPath, serverRecordPath);
  const markdown = snapshot?.files.find(file => file.path === relativePath)?.content;
  const sections = markdown === undefined ? [] : headingOutline(markdown).filter(heading => heading.level > 1);
  useEffect(() => {
    if (markdown === undefined) return;
    document.title = `${relativePath.split("/").pop()} · Second Brain Explorer`;
    try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid fragment is ignored. */ }
  }, [markdown, relativePath]);
  const renderRecord = (content: ReactNode) => <div className="record-layout">
    <article className="markdown-card" id="record-content">
      <div className="record-context"><span className="record-path">{relativePath}</span></div>
      {content}
    </article>
    {sections.length > 1 && <TableOfContents headings={sections} />}
  </div>;
  return <ApplicationShell><main className="record-shell">
    {loading ? renderRecord(<p role="status">Loading saved content…</p>) : markdown === undefined ? renderRecord(<><h2>File unavailable</h2><p>This file is not in the current snapshot. It may have been deleted or renamed.</p><a href={appPath("/markdown/")}>Browse Markdown files</a></>) : <RecordSearch key={relativePath} markdown={markdown} resolveLink={href => readerLink(relativePath, href, resolveWiki)}>{renderRecord}</RecordSearch>}
  </main></ApplicationShell>;
}
