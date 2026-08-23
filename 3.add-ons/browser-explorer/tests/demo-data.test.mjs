import assert from "node:assert/strict";
import test from "node:test";
import { createDemoData } from "../scripts/demo-data.mjs";

test("synthetic demo graph is deterministic and around the intended scale", () => {
  const first = createDemoData();
  const second = createDemoData();
  assert.deepEqual(first, second);
  assert.equal(first.schemaVersion, 5);
  assert.match(first.source, /synthetic graph demo data/i);
  assert.equal(first.graph.nodes.length, 100);
  assert.equal(first.graph.themes.length, 7);
  assert.ok(first.graph.nodes.every((node) => node.path === ""));
  const ids = new Set(first.graph.nodes.map((node) => node.id));
  assert.equal(ids.size, first.graph.nodes.length);
  assert.ok(first.graph.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target)));
  assert.ok(first.graph.nodes.some((node) => node.themeIds.length > 1));
});

test("demo data can retain the repository markdown index for read-only browsing", () => {
  const markdown = { files: [{ path: "README.md", title: "Second brain", filename: "README.md", folders: [] }] };
  const demo = createDemoData(markdown);
  assert.deepEqual(demo.markdown, markdown);
});
