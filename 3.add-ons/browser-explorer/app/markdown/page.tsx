"use client";

import { useEffect, useMemo, useState } from "react";
import ApplicationShell from "../application-shell";
import type { BrainData, MarkdownFile } from "../brain-data";
import { brainDataPath } from "../data-source";

type Folder = { name: string; path: string; folders: Folder[]; files: MarkdownFile[] };

export function matchesMarkdownFile(file: MarkdownFile, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [file.filename, file.title, file.path].some((value) => value.toLocaleLowerCase().includes(needle));
}

export function buildFolderTree(files: MarkdownFile[]): Folder {
  const root: Folder = { name: "", path: "", folders: [], files: [] };
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    let folder = root;
    for (const segment of file.folders) {
      let child = folder.folders.find((item) => item.name === segment);
      if (!child) { child = { name: segment, path: [...(folder.path ? folder.path.split("/") : []), segment].join("/"), folders: [], files: [] }; folder.folders.push(child); }
      folder = child;
    }
    folder.files.push(file);
  }
  return root;
}

function recordHref(filePath: string) { return `/records/${filePath.split("/").map(encodeURIComponent).join("/")}`; }

function FileNode({ file }: { file: MarkdownFile }) {
  return <li><a className="markdown-file-link" href={recordHref(file.path)}><i className="fa-regular fa-file-lines" aria-hidden="true" /><span><strong>{file.title}</strong><small>{file.path}</small></span></a></li>;
}

function FolderNode({ folder, searching }: { folder: Folder; searching: boolean }) {
  return <li className="folder-node"><details open={searching || folder.path.split("/").length < 2}>
    <summary className="folder-control"><i className="fa-solid fa-folder" aria-hidden="true" /> {folder.name}</summary>
    <ul>{folder.folders.map((child) => <FolderNode key={child.path} folder={child} searching={searching} />)}
      {folder.files.map((file) => <FileNode key={file.path} file={file} />)}</ul>
  </details></li>;
}

export default function MarkdownPage() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => { fetch(brainDataPath).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data: BrainData) => { setFiles(data.markdown.files); setStatus("ready"); }).catch(() => setStatus("error")); }, []);
  const matches = useMemo(() => files.filter((file) => matchesMarkdownFile(file, query)), [files, query]);
  const tree = useMemo(() => buildFolderTree(matches), [matches]);
  return <ApplicationShell><section className="reader-workspace" aria-labelledby="reader-title">
    <header className="reader-header"><p className="eyebrow">Repository library</p><h2 id="reader-title">Markdown reader</h2><p>Browse committed Markdown files without changing repository content.</p>
      <label className="reader-search"><span>Search Markdown files</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filename, title, or path" /></label>
    </header>
    {status === "loading" && <div className="reader-state" role="status">Loading Markdown files…</div>}
    {status === "error" && <div className="reader-state error-state" role="alert"><h3>Markdown index unavailable</h3><p>Rebuild the browser data, then refresh this page.</p></div>}
    {status === "ready" && matches.length === 0 && <div className="reader-state"><h3>No Markdown files found</h3><p>Try a different filename, title, or path.</p></div>}
    {status === "ready" && matches.length > 0 && <nav className="folder-tree" aria-label="Markdown files"><ul>
      {tree.folders.map((folder) => <FolderNode key={folder.path} folder={folder} searching={Boolean(query.trim())} />)}
      {tree.files.map((file) => <FileNode key={file.path} file={file} />)}
    </ul></nav>}
  </section></ApplicationShell>;
}
