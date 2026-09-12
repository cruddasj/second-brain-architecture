import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownContent, {
  headingOutline,
} from "../app/records/[...path]/markdown-content.tsx";

test("event cards keep their labels, metadata order and inline rendering", () => {
  const markdown =
    "- [event:example] A **recorded** event.\n  - Date: 2026-09-12\n  - Source: [Example](https://example.com)\n  - Transaction: fixture";
  const html = renderToStaticMarkup(
    React.createElement(MarkdownContent, { markdown }),
  );
  assert.doesNotMatch(html, /event:example/);
  assert.match(html, /class="event-list"><section class="event-item"/);
  assert.match(
    html,
    /class="event-metadata-wrap"><table aria-label="Event metadata"/,
  );
  assert.match(html, /A <strong>recorded<\/strong> event\./);
  assert.match(
    html,
    /<th scope="row">Date<\/th>[\s\S]*<th scope="row">Source<\/th>[\s\S]*<th scope="row">Transaction<\/th>/,
  );
  assert.match(html, /href="https:\/\/example.com"/);
});

test("mixed, ordered and malformed metadata lists keep ordinary list markup", () => {
  for (const markdown of [
    "- [state:one] Fact\n  - Source: Example\n- Ordinary item",
    "- [state:one] Fact\n  - Source: Example\n- [event:two] Event\n  - Date: 2026-09-12",
    "1. [event:one] Event\n   - Date: 2026-09-12",
    "- [event:one] Event\n  - Effective: 2026-09-12",
    "- [state:one] Fact\n  - Source: Example\n    - Nested value",
    "- [state:one] Fact without metadata",
  ]) {
    const html = renderToStaticMarkup(
      React.createElement(MarkdownContent, { markdown }),
    );
    assert.doesNotMatch(html, /class="(?:state|event)-list"/);
    assert.match(html, /<(?:ul|ol)><li>\[(?:state|event):/);
  }
});
test("state cards hide internal keys and render compact metadata tables", () => {
  const html = renderToStaticMarkup(
    React.createElement(MarkdownContent, {
      markdown:
        "# Example\n\n## Current state\n\n- [state:example] A synthetic fact.\n  - Effective: 2026-09-07\n  - Last confirmed: 2026-09-07\n  - Source: Test fixture\n  - Transaction: 550e8400-e29b-41d4-a716-446655440000",
    }),
  );
  assert.doesNotMatch(html, /state:example/);
  assert.match(html, /class="state-item"/);
  assert.match(html, /aria-label="Fact metadata"/);
  assert.match(html, /A synthetic fact/);
});

test("HTML comments hide Markdown sections without hiding fenced examples", () => {
  const markdown = `# Visible heading

Before <!-- hidden inline --> after.

<!--
## Hidden heading

This whole section is hidden.
-->

\`\`\`html
<!-- A visible code example -->
\`\`\``;
  const html = renderToStaticMarkup(
    React.createElement(MarkdownContent, { markdown }),
  );
  assert.match(html, /Visible heading/);
  assert.match(html, /Before\s+after\./);
  assert.doesNotMatch(html, /hidden inline|Hidden heading|whole section/);
  assert.match(html, /A visible code example/);
  assert.deepEqual(
    headingOutline(markdown).map(({ text }) => text),
    ["Visible heading"],
  );
});

test("bullet and numbered lists retain semantic nesting and visible markers", async () => {
  const markdown = `- First bullet
  - Nested bullet
- Second bullet

1. First step
2. Second step`;
  const html = renderToStaticMarkup(
    React.createElement(MarkdownContent, { markdown }),
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(
    html,
    /<ul><li>First bullet<ul><li>Nested bullet<\/li><\/ul><\/li><li>Second bullet<\/li><\/ul>/,
  );
  assert.match(html, /<ol><li>First step<\/li><li>Second step<\/li><\/ol>/);
  assert.match(css, /\.markdown-content ul \{ list-style-type: disc; \}/);
  assert.match(css, /\.markdown-content ol \{ list-style-type: decimal; \}/);
  assert.match(css, /\.markdown-content ul ul \{ list-style-type: circle; \}/);
  assert.match(
    css,
    /\.markdown-content :is\(ul, ol\) :is\(ul, ol\) \{ margin: 7px 0 0; \}/,
  );
});

test("task-list syntax renders read-only checked and unchecked controls", async () => {
  const markdown = `- [ ] Pending task
- [x] Completed **task**
- [X] Also complete`;
  const html = renderToStaticMarkup(
    React.createElement(MarkdownContent, { markdown }),
  );
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(html, /class="task-list-item"/);
  assert.match(html, /type="checkbox" disabled=""/);
  assert.match(html, /type="checkbox" disabled="" checked=""/);
  assert.match(html, /Pending task/);
  assert.match(html, /Completed <strong>task<\/strong>/);
  assert.doesNotMatch(html, /\[\s\]|\[[xX]\]/);
  assert.match(
    css,
    /\.markdown-content \.task-list-item \{[^}]*list-style: none/,
  );
  assert.match(
    css,
    /\.task-list-label input \{[^}]*accent-color: var\(--primary\)/,
  );
});
