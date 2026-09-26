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

test("fuzzy content matching accepts one edit per whole word while retaining prefixes and AND semantics", async () => {
  const body = "A golden dog enjoys cafés. cat planet zebra 𐐨𐐩𐐪";
  const index = new ContentSearchIndex();
  await index.update([{ path: "sample.md", content: body }]);
  const positives = ["dgo", "dag", "dgog", "glden", "xolden", "oglden", "goldenx", "gold cfaes", "glden dag", "CÁFEE", "𐐩𐐨𐐪"];
  const negatives = ["dggx", "gldn", "glden missing", "doogx", "cta missing", "cut missing", "plnaetx", "𐐩𐐪𐐨", "at", "ct"];
  for (const query of positives.concat(negatives)) {
    const expected = positives.includes(query);
    assert.deepEqual(index.search(query), expected ? ["sample.md"] : [], query);
    assert.equal(matchesSearchText(body, query), expected, `Fallback: ${query}`);
  }
  // Two-edit candidates can share a deletion key; they must still be rejected.
  await index.update([{ path: "sample.md", content: "abcd" }]);
  assert.deepEqual(index.search("acbd"), ["sample.md"]);
  assert.deepEqual(index.search("acdb"), []);
});

test("candidate indexing agrees with single-edit distance and fallback across short token combinations", async () => {
  const combinations = (length) => length ? combinations(length - 1).flatMap((word) => ["a", "b", "c"].map((letter) => word + letter)) : [""];
  const words = [...combinations(2), ...combinations(3), ...combinations(4)];
  const distance = (word, query) => {
    const matrix = Array.from({ length: word.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= query.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= word.length; i++) for (let j = 1; j <= query.length; j++) {
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + Number(word[i - 1] !== query[j - 1]));
      if (i > 1 && j > 1 && word[i - 1] === query[j - 2] && word[i - 2] === query[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
    return matrix[word.length][query.length];
  };
  const index = new ContentSearchIndex();
  await index.update(words.map((word) => ({ path: `${word}.md`, content: word })));
  for (const query of [...combinations(1), ...words]) {
    const expected = words.filter((word) => word.startsWith(query) || (query.length >= 3 && word.length >= 3 && distance(word, query) <= 1));
    assert.deepEqual(index.search(query).sort(), expected.map((word) => `${word}.md`).sort(), query);
    assert.deepEqual(words.filter((word) => matchesSearchText(word, query)), expected, `Fallback: ${query}`);
  }
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
  assert.deepEqual(restored.search("dgos"), ["keep.md"]);
  const changed = [original[0], { path: "change.md", sha: "d", content: "replacement" }, { ...original[2], path: "renamed.md" }];
  assert.deepEqual(await restored.update(changed, cache), { indexed: 2, count: 3 });
  assert.deepEqual(restored.search("obsolete"), []);
  assert.deepEqual(restored.search("obsoelte"), []);
  assert.deepEqual(restored.search("replacement"), ["change.md"]);
  assert.deepEqual(restored.search("replacemnet"), ["change.md"]);
  assert.deepEqual(restored.search("removed"), ["renamed.md"]);
  assert.deepEqual(restored.search("remvoed"), ["renamed.md"]);
  assert.deepEqual(restored.search("dog"), ["keep.md"]);
  const removedOnly = new ContentSearchIndex();
  assert.deepEqual(await removedOnly.update([original[0]], cache), { indexed: 0, count: 1 });
  assert.deepEqual(removedOnly.search("removed"), []);
  assert.deepEqual(removedOnly.search("remvoed"), []);
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
  for (const badCache of [{ ...cache, version: "1:flexsearch-0.8.212" }, { version: searchIndexVersion, chunks: null }, { ...cache, chunks: [] },
    { ...cache, words: undefined }, { ...cache, words: [["test.md", [null]]] }, { ...cache, words: [["other.md", ["oldword"]]] }]) {
    assert.deepEqual(await index.update([{ path: "test.md", content: "rebuilt" }], badCache), { indexed: 1, count: 1 });
    assert.deepEqual(index.search("rebuilt"), ["test.md"]);
    assert.deepEqual(index.search("rebulit"), ["test.md"]);
  }
});

test("filter searches return all matches beyond the library default limit", async () => {
  const index = new ContentSearchIndex();
  await index.update(Array.from({ length: 125 }, (_, i) => ({ path: `${i}.md`, content: "sharedword" })));
  assert.equal(index.search("sharedword").length, 125);
  assert.equal(index.search("sharedwrod").length, 125);
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
