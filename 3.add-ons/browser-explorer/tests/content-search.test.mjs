import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import { ContentSearchIndex, searchIndexVersion } from "../offline/search-index.mjs";
import { markdownToSearchText, matchesSearchText } from "../offline/search-text.mjs";
import { matchesGraphNode, matchesMarkdownFile } from "../app/search-filters.ts";
import { readSearchCache, saveSearchCache, saveState } from "../offline/storage.mjs";

test("content-only matches cover full bodies, code, labels, accents and word prefixes", async () => {
  const body = `# Sample\n${"Ordinary text. ".repeat(50)}\nA **golden** dog enjoys cafés.\n\n~~~js\nconst unique_code = '<retained>';\n~~~\n\n\`inline_symbol\`\n[visible link](hidden-destination.md) ![image alt](hidden-image.png)\n[[other-note|wiki label]]\n<!-- hiddencomment -->`;
  const index = new ContentSearchIndex();
  await index.update([{ path: "test.md", content: body }]);
  assert.match(markdownToSearchText(body.replaceAll("\n", "\r\n")), /<retained>/);
  for (const query of ["dog", "GOLD dog", "cafe", "unique code", "retained", "inline symbol", "visible link", "image alt", "wiki label"]) {
    assert.deepEqual(index.search(query), ["test.md"], query);
    assert.equal(matchesSearchText(markdownToSearchText(body), query), true, `Fallback: ${query}`);
  }
  for (const query of ["hiddencomment", "hidden-destination", "hidden-image", "other-note", "dog missing", " ", "!!!"]) {
    assert.deepEqual(index.search(query), [], query);
    assert.equal(matchesSearchText(markdownToSearchText(body), query), false, `Fallback: ${query}`);
  }
});

test("filters preserve metadata substring matching, curated graph scope and collection restrictions", () => {
  const file = { path: "notes/test.md", title: "Example title", filename: "test.md", folders: ["notes"] };
  const node = { ...file, collection: "examples", excerpt: "A short preview", headings: ["Current state"] };
  for (const query of ["TEST.MD", "example title", "notes/", "  "]) {
    assert.equal(matchesMarkdownFile(file, query), true);
    assert.equal(matchesGraphNode(node, query, "all", new Set()), true);
  }
  const content = new Set(["notes/test.md", "README.md"]);
  assert.equal(matchesMarkdownFile(file, "dog", content), true);
  assert.equal(matchesGraphNode(node, "dog", "examples", content), true);
  assert.equal(matchesGraphNode(node, "dog", "other collection", content), false);
  assert.equal(matchesGraphNode({ ...node, path: "absent.md" }, "dog", "all", content), false);
  assert.equal(matchesGraphNode(node, "short preview", "all", new Set()), true);
  assert.equal(matchesGraphNode(node, "title a short", "all", new Set()), true);
  assert.equal(matchesGraphNode(node, "current state", "all", new Set()), true);
  assert.equal(matchesMarkdownFile(file, "missing"), false);
});

test("export/import reuses unchanged content and replaces changed, renamed and deleted files", async () => {
  const original = [
    { path: "keep.md", sha: "a", content: "dogs" },
    { path: "change.md", sha: "b", content: "obsolete" },
    { path: "delete.md", sha: "c", content: "removed" },
  ];
  const index = new ContentSearchIndex();
  assert.deepEqual(await index.update(original), { indexed: 3, count: 3 });
  const cache = JSON.parse(JSON.stringify(await index.export()));
  const restored = new ContentSearchIndex();
  assert.deepEqual(await restored.update(original, cache), { indexed: 0, count: 3 });
  assert.deepEqual(restored.search("dog"), ["keep.md"]);
  const changed = [original[0], { path: "change.md", sha: "d", content: "replacement" }, { ...original[2], path: "renamed.md" }];
  assert.deepEqual(await restored.update(changed, cache), { indexed: 2, count: 3 });
  assert.deepEqual(restored.search("obsolete"), []);
  assert.deepEqual(restored.search("replacement"), ["change.md"]);
  assert.deepEqual(restored.search("removed"), ["renamed.md"]);
  assert.deepEqual(restored.search("dog"), ["keep.md"]);
  const removedOnly = new ContentSearchIndex();
  assert.deepEqual(await removedOnly.update([original[0]], cache), { indexed: 0, count: 1 });
  assert.deepEqual(removedOnly.search("removed"), []);
  assert.deepEqual(await restored.update([], await restored.export()), { indexed: 0, count: 0 });
  assert.deepEqual(restored.search("dog"), []);
});

test("content hashes detect edits without supplied blob hashes and cache problems rebuild", async () => {
  const index = new ContentSearchIndex();
  await index.update([{ path: "test.md", content: "oldword" }]);
  const cache = await index.export();
  assert.deepEqual(await index.update([{ path: "test.md", content: "newword" }], cache), { indexed: 1, count: 1 });
  assert.deepEqual(index.search("oldword"), []);
  assert.deepEqual(index.search("newword"), ["test.md"]);
  for (const badCache of [{ ...cache, version: "old" }, { version: searchIndexVersion, chunks: null }, { ...cache, chunks: [] }]) {
    assert.deepEqual(await index.update([{ path: "test.md", content: "rebuilt" }], badCache), { indexed: 1, count: 1 });
    assert.deepEqual(index.search("rebuilt"), ["test.md"]);
  }
});

test("filter searches return all matches beyond the library default limit", async () => {
  const index = new ContentSearchIndex();
  await index.update(Array.from({ length: 125 }, (_, i) => ({ path: `${i}.md`, content: "sharedword" })));
  assert.equal(index.search("sharedword").length, 125);
});

test("search cache is repository-scoped, optional and cannot restore data after disconnect or a newer sync", async () => {
  const snapshot = { repositoryId: 1, repository: "example/notes", branch: "main", commit: "one", files: [] };
  const cache = { version: searchIndexVersion, files: [], chunks: [] };
  await saveState({ snapshot, connection: { repository: snapshot.repository } });
  await saveSearchCache(snapshot, cache);
  assert.deepEqual(await readSearchCache(snapshot), cache);
  assert.equal(await readSearchCache({ ...snapshot, repositoryId: 2 }), null);
  assert.equal(await readSearchCache({ ...snapshot, branch: "other" }), null);
  const newer = { ...snapshot, commit: "two" };
  await saveState({ snapshot: newer, connection: { repository: snapshot.repository } });
  await saveSearchCache(snapshot, { ...cache, version: "stale" });
  assert.deepEqual(await readSearchCache(newer), cache);
  await saveState({ snapshot: null, connection: null });
  assert.equal(await readSearchCache(snapshot), null);
  await saveSearchCache(snapshot, cache);
  assert.equal(await readSearchCache(snapshot), null);
});
