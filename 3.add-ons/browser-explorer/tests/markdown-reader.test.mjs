import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("shared shell exposes both destinations and pathname-based active semantics", async () => {
  const shell = await source("../app/application-shell.tsx");
  assert.match(shell, /usePathname\(\)/);
  assert.match(shell, /href: "\/", label: "Knowledge graph"/);
  assert.match(shell, /href: "\/markdown", label: "Markdown reader"/);
  assert.match(shell, /aria-current=\{item\.active \? "page"/);
  for (const route of ["../app/page.tsx", "../app/markdown/page.tsx", "../app/records/[...path]/page.tsx"])
    assert.match(await source(route), /ApplicationShell/);
});

test("reader search is case-insensitive across filename, title, and path and links encoded segments", async () => {
  const reader = await source("../app/markdown/page.tsx");
  assert.match(reader, /\[file\.filename, file\.title, file\.path\]/);
  assert.match(reader, /toLocaleLowerCase\(\)/);
  assert.match(reader, /filePath\.split\("\/"\)\.map\(encodeURIComponent\)\.join\("\/"\)/);
  assert.match(reader, /Search Markdown files/);
  assert.match(reader, /<details open=/);
  assert.doesNotMatch(reader, /name: "Repository"/);
  assert.match(reader, /tree\.folders\.map/);
  assert.match(reader, /tree\.files\.map/);
  assert.match(reader, /role="status"/);
  assert.match(reader, /role="alert"/);
});

test("record grid places article before the sticky right-hand contents disclosure", async () => {
  const [page, toc, css] = await Promise.all([
    source("../app/records/[...path]/page.tsx"),
    source("../app/records/[...path]/table-of-contents.tsx"),
    source("../app/globals.css"),
  ]);
  assert.ok(page.indexOf('<article className="markdown-card"') < page.indexOf("<TableOfContents"));
  assert.match(css, /\.record-layout:has\(\.record-toc\) \{ grid-template-columns: minmax\(0, 1fr\) 220px; \}/);
  assert.match(css, /\.record-layout \{[^}]*align-items: start/);
  assert.match(css, /\.record-toc \{ position: sticky; top: 0; align-self: start/);
  assert.match(css, /\.record-context \{[^}]*text-align: left/);
  assert.match(css, /\.markdown-card \{ padding: 32px/);
  assert.match(toc, /<aside className="record-toc"/);
  assert.doesNotMatch(toc, /<details|matchMedia/);
});
