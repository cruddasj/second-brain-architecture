import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("shared shell exposes every destination with pathname-based active semantics", async () => {
  const shell = await source("../app/application-shell.tsx");
  assert.match(shell, /usePathname\(\)/);
  assert.match(shell, /href: "\/", label: "Knowledge graph"/);
  assert.match(shell, /href: "\/markdown", label: "Markdown reader"/);
  assert.match(shell, /href: "\/connection", label: "Repository sync", icon: "fa-up-down"/);
  assert.match(shell, /aria-current=\{item\.active \? "page"/);
  assert.doesNotMatch(shell, /navigation-note|fa-key/);
  for (const route of ["../app/page.tsx", "../app/markdown/page.tsx", "../app/record/page.tsx", "../app/connection/page.tsx"])
    assert.match(await source(route), /ApplicationShell/);
});

test("responsive navigation becomes a safe-area-aware persistent application bar", async () => {
  const [css, layout] = await Promise.all([source("../app/globals.css"), source("../app/layout.tsx")]);
  assert.match(css, /--bottom-navigation-height: 64px/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.navigation-panel, \.navigation-collapsed \.navigation-panel \{[\s\S]*?position: fixed;[\s\S]*?inset: auto 0 0;/);
  assert.match(css, /height: calc\(var\(--bottom-navigation-height\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /padding: 10px 10px calc\(10px \+ var\(--bottom-navigation-height\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /@media \(max-width: 519px\)[\s\S]*?clip-path: inset\(50%\)/);
  assert.match(css, /\.application-menu a\[aria-current="page"\] \{ box-shadow: inset 0 -3px var\(--primary\); \}/);
  assert.match(layout, /viewportFit: "cover"/);
});

test("reader search is case-insensitive across filename, title, and path and links encoded segments", async () => {
  const reader = await source("../app/markdown/page.tsx");
  assert.match(reader, /\[file\.filename, file\.title, file\.path\]/);
  assert.match(reader, /toLocaleLowerCase\(\)/);
  assert.match(reader, /recordHref\(file.path\)/);
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
    source("../app/record/page.tsx"),
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
