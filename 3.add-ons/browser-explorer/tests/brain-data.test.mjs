import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = JSON.parse(await readFile(new URL("../public/brain-data.json", import.meta.url), "utf8"));

test("explorer data is structurally valid for a clean scaffold", () => {
  assert.equal(data.schemaVersion, 5);
  assert.equal("skills" in data, false);
  assert.match(data.source, /no dashboard flag required/);
  assert.equal(data.graph.nodes.some((node) => node.path === "2.core/memory/core.md"), false);
  assert.equal(data.graph.nodes.some((node) => node.kind !== "collection" && node.path.endsWith("/index.md")), false);
});

test("theme membership remains explicit and reciprocal", () => {
  const themeIds = new Set(data.graph.themes.map((theme) => theme.id));
  for (const node of data.graph.nodes) {
    for (const themeId of node.themeIds) {
      assert.ok(themeIds.has(themeId));
      assert.ok(data.graph.edges.some((edge) => edge.kind === "reference" && edge.source === node.id && edge.target === themeId));
      assert.ok(data.graph.edges.some((edge) => edge.kind === "reference" && edge.source === themeId && edge.target === node.id));
    }
  }
});

test("Markdown index covers the repository deterministically", () => {
  assert.ok(data.markdown.files.some((file) => file.path === "README.md"));
  assert.ok(data.markdown.files.some((file) => file.path === "2.core/system/directory.md"));
  assert.deepEqual(data.markdown.files.map((file) => file.path), [...data.markdown.files.map((file) => file.path)].sort((a, b) => a.localeCompare(b)));
  assert.ok(data.markdown.files.every((file) => file.path.endsWith(".md") && !file.path.split("/").some((part) => [".git", ".next", "node_modules"].includes(part))));
});
