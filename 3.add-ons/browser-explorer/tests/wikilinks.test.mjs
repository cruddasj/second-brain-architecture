import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createWikilinkIndex, markdownLinks, metadata } from "../offline/markdown-links.mjs";
import { buildGraph } from "../offline/snapshot.mjs";
import { readerLink, recordHref } from "../offline/links.mjs";
import { parseMarkdown, headingOutline } from "../app/markdown-parser.ts";
import MarkdownContent from "../app/records/[...path]/markdown-content.tsx";

const fixture = JSON.parse(readFileSync(new URL("../../../2.core/scripts/fixtures/wikilinks.json", import.meta.url), "utf8"));
const entries = Object.entries(fixture.records).map(([path, content]) => ({ path, content }));
const resolve = createWikilinkIndex(entries);

test("Python and browser share wikilink resolution cases", () => {
  for (const item of fixture.cases) {
    const result = resolve(fixture.current, item.link);
    assert.deepEqual(result, item.path ? { path: item.path, heading: item.heading } : null, item.link);
    assert.equal(readerLink(fixture.current, item.link, resolve), item.path ? recordHref(item.path, item.heading) : undefined, item.link);
  }
});

test("link extraction ignores code, comments, embeds and escapes", () => {
  const content = '[[Real|label]] [Real](real.md)\n`[[Code]]`\n``[[Code2]]``\n~~~\n[[Fence]]\n~~~\n<!-- [[Comment]] -->\n    [[Indented]]\n![[Embed]] \\[[Escaped]]';
  assert.deepEqual(markdownLinks(content), ["real.md", "[[Real|label]]"]);
});

test("reader renders aliases and unresolved text, including table cells", () => {
  const markdown = '[[Shipping|Launch details]] [[duplicate]]\n\n| Link | Other |\n| --- | --- |\n| [[Release Plan|Plan label]] | Text |\n\n`[[Shipping]]`\n\n~~~\n[[Shipping]]\n~~~';
  assert.equal(parseMarkdown(markdown).find(b => b.type === "table").rows[0].length, 2);
  const html = renderToStaticMarkup(React.createElement(MarkdownContent, {
    markdown, resolveLink: href => readerLink(fixture.current, href, resolve),
  }));
  assert.match(html, /href="[^"]+"[^>]*>Launch details<\/a>/);
  assert.match(html, /<span title="Unresolved or ambiguous note link">duplicate<\/span>/);
  assert.match(html, /href="[^"]+"[^>]*>Plan label<\/a>/);
  assert.match(html, /<code>\[\[Shipping\]\]<\/code>/);
  const anchors = headingOutline(fixture.records["2.core/knowledge/projects/plan.md"]).map(h => h.id);
  for (const anchor of ["delivery-conditions", "repeated-2", "cafe-costs", "fixed"]) assert.ok(anchors.includes(anchor));
});

test("graph resolves wiki and ordinary links once, ignoring fenced examples", () => {
  const a = "2.core/knowledge/projects/a.md", b = "2.core/knowledge/projects/b.md", theme = "2.core/themes/example.md";
  const graph = buildGraph([
    { path: a, content: '# A\n[[B]] [B](b.md)\n[[Example]]\n```\n[[C]]\n```' },
    { path: b, content: '# B' },
    { path: theme, content: '---\ntitle: Example\ntype: theme\n---\n[[A]]' },
    { path: "2.core/knowledge/projects/c.md", content: '# C' },
  ]);
  const refs = graph.edges.filter(e => e.kind === "reference");
  assert.equal(refs.filter(e => e.source === a.slice(0, -3) && e.target === b.slice(0, -3)).length, 1);
  assert.ok(!refs.some(e => e.target.endsWith('/c')));
  assert.deepEqual(graph.nodes.find(n => n.path === a).themeIds, [theme.slice(0, -3)]);
});

test("YAML metadata supports quoted commas and block aliases without executing tags", () => {
  assert.deepEqual(metadata('---\ntitle: "A: title"\naliases:\n  - "one, two"\n  - second\n---\n'), { title: "A: title", aliases: ["one, two", "second"] });
  assert.deepEqual(metadata('---\ntitle: A\ntitle: B\n---\n'), {});
});
