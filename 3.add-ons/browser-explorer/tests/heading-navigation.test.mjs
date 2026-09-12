import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  headingDefinition,
  headingOutline,
  headingSlug,
  uniqueHeadingId,
} from "../app/markdown-parser.ts";

const rendererUrl = new URL(
  "../app/records/[...path]/markdown-content.tsx",
  import.meta.url,
);
const pageUrl = new URL("../app/record/page.tsx", import.meta.url);
const tocUrl = new URL(
  "../app/records/[...path]/table-of-contents.tsx",
  import.meta.url,
);

test("heading slugs are stable, preserve explicit fragments, and disambiguate duplicates", async () => {
  const source = await readFile(rendererUrl, "utf8");
  assert.equal(headingSlug("Café **notes** & 日本語"), "cafe-notes-日本語");
  assert.equal(headingSlug("?!"), "section");
  assert.deepEqual(headingDefinition("My heading {#Keep.This}"), {
    text: "My heading",
    base: "Keep.This",
  });
  const used = new Set(["same", "same-2"]);
  assert.equal(uniqueHeadingId("same", used), "same-3");
  assert.deepEqual(
    headingOutline(
      "# Repeat\n\n## Repeat\n\n## Custom {#Anchor}\n\n## Custom {#Anchor}",
    ).map((heading) => heading.id),
    ["repeat", "repeat-2", "Anchor", "Anchor-2"],
  );
  assert.match(source, /id=\{block\.id\}/);
  assert.match(source, /href=\{`#\$\{block\.id\}`\}/);
});

test("record navigation exposes fragment links and the active location without a redundant skip route", async () => {
  const [page, toc] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(tocUrl, "utf8"),
  ]);
  assert.doesNotMatch(page, /Skip to document content/);
  assert.match(page, /id="record-content"/);
  assert.match(toc, /aria-label="Table of contents"/);
  assert.match(toc, /href=\{`#\$\{heading\.id\}`\}/);
  assert.match(toc, /aria-current=\{activeId === heading\.id \? "location"/);
  assert.match(toc, /IntersectionObserver/);
});

test("responsive table of contents uses a persistent labelled navigation panel", async () => {
  const [toc, css] = await Promise.all([
    readFile(tocUrl, "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(
    toc,
    /<aside className="record-toc" aria-labelledby="record-toc-title">/,
  );
  assert.match(toc, /<h2 id="record-toc-title">On this page<\/h2>/);
  assert.doesNotMatch(toc, /<details|<summary|matchMedia/);
  assert.match(
    css,
    /@media \(max-width: 820px\).*\.record-layout:has\(\.record-toc\)/s,
  );
  assert.match(css, /\.record-toc \{ position: sticky; top: 0/);
  assert.match(css, /\.record-toc h2 \{[^}]*color: var\(--primary\)/);
  assert.match(
    css,
    /\.record-toc a \{[^}]*color: var\(--primary\)[^}]*text-decoration: underline/,
  );
});

test("graph section labels link into record fragments", async () => {
  const graph = await readFile(
    new URL("../app/knowledge-graph.tsx", import.meta.url),
    "utf8",
  );
  assert.match(graph, /selectedSections\.map/);
  assert.match(graph, /recordHref\(selected.path, id\)/);
});
