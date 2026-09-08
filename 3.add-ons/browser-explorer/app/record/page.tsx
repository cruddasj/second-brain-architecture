"use client";
import { appPath } from "../../offline/paths.mjs";

import { useEffect, useState } from "react";
import ApplicationShell from "../application-shell";
import { useBrain } from "../brain-provider";
import MarkdownContent, { headingOutline } from "../records/[...path]/markdown-content";
import TableOfContents from "../records/[...path]/table-of-contents";
import { readerLink } from "../../offline/links.mjs";

export default function RecordPage() {
  const { snapshot, loading } = useBrain();
  const [relativePath, setPath] = useState("");
  useEffect(() => { setPath(new URLSearchParams(window.location.search).get("file") || ""); }, []);
  const markdown = snapshot?.files.find(file => file.path === relativePath)?.content;
  const sections = markdown === undefined ? [] : headingOutline(markdown).filter(heading => heading.level > 1);
  useEffect(() => {
    if (markdown === undefined) return;
    document.title = `${relativePath.split("/").pop()} · Second Brain Explorer`;
    try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* Invalid fragment is ignored. */ }
  }, [markdown, relativePath]);
  return <ApplicationShell><main className="record-shell"><div className="record-layout">
    <article className="markdown-card" id="record-content">
      <div className="record-context"><span className="record-path">{relativePath}</span></div>
      {loading ? <p role="status">Loading saved content…</p> : markdown === undefined ? <><h2>File unavailable</h2><p>This file is not in the current snapshot. It may have been deleted or renamed.</p><a href={appPath("/markdown/")}>Browse Markdown files</a></> : <MarkdownContent markdown={markdown} resolveLink={href => readerLink(relativePath, href)} />}
    </article>
    {sections.length > 1 && <TableOfContents headings={sections} />}
  </div></main></ApplicationShell>;
}
