import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownContent from "../app/records/[...path]/markdown-content.tsx";
test("state cards hide internal keys and render compact metadata tables", () => {
 const html = renderToStaticMarkup(React.createElement(MarkdownContent, { markdown: "# Example\n\n## Current state\n\n- [state:example] A synthetic fact.\n  - Effective: 2026-09-07\n  - Last confirmed: 2026-09-07\n  - Source: Test fixture\n  - Transaction: 550e8400-e29b-41d4-a716-446655440000" }));
 assert.doesNotMatch(html, /state:example/);
 assert.match(html, /class="state-item"/);
 assert.match(html, /aria-label="Fact metadata"/);
 assert.match(html, /A synthetic fact/);
});
