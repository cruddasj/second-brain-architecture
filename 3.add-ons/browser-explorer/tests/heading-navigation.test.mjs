import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererUrl = new URL("../app/records/[...path]/markdown-content.tsx", import.meta.url);
const pageUrl = new URL("../app/records/[...path]/page.tsx", import.meta.url);
const tocUrl = new URL("../app/records/[...path]/table-of-contents.tsx", import.meta.url);

test("heading slugs are stable, preserve explicit fragments, and disambiguate duplicates", async () => {
  const source = await readFile(rendererUrl, "utf8");
  assert.match(source, /normalize\("NFKD"\)/);
  assert.match(source, /const explicit = source\.match/);
  assert.match(source, /while \(used\.has\(id\)\) id = `\$\{base\}-\$\{suffix\+\+\}`/);
  assert.match(source, /id=\{block\.id\}/);
  assert.match(source, /href=\{`#\$\{block\.id\}`\}/);
});

test("record navigation exposes fragment links and the active location without a redundant skip route", async () => {
  const [page, toc] = await Promise.all([readFile(pageUrl, "utf8"), readFile(tocUrl, "utf8")]);
  assert.doesNotMatch(page, /Skip to document content/);
  assert.match(page, /id="record-content"/);
  assert.match(toc, /aria-label="Table of contents"/);
  assert.match(toc, /href=\{`#\$\{heading\.id\}`\}/);
  assert.match(toc, /aria-current=\{activeId === heading\.id \? "location"/);
  assert.match(toc, /IntersectionObserver/);
});

test("responsive table of contents uses a persistent labelled navigation panel", async () => {
  const [toc, css] = await Promise.all([readFile(tocUrl, "utf8"), readFile(new URL("../app/globals.css", import.meta.url), "utf8")]);
  assert.match(toc, /<aside className="record-toc" aria-labelledby="record-toc-title">/);
  assert.match(toc, /<h2 id="record-toc-title">On this page<\/h2>/);
  assert.doesNotMatch(toc, /<details|<summary|matchMedia/);
  assert.match(css, /@media \(max-width: 820px\).*\.record-layout:has\(\.record-toc\)/s);
  assert.match(css, /\.record-toc \{ position: sticky; top: 0/);
  assert.match(css, /\.record-toc h2 \{[^}]*color: var\(--primary\)/);
  assert.match(css, /\.record-toc a \{[^}]*color: var\(--primary\)[^}]*text-decoration: underline/);
});

test("graph section labels link into record fragments", async () => {
  const graph = await readFile(new URL("../app/knowledge-graph.tsx", import.meta.url), "utf8");
  assert.match(graph, /selectedSections\.map/);
  assert.match(graph, /#\$\{encodeURIComponent\(id\)\}/);
});
