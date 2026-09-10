import { appPath } from "../offline/paths.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import "fake-indexeddb/auto";
import { readState, saveState } from "../offline/storage.mjs";
import { buildBrainData, resolveRecordLink } from "../offline/snapshot.mjs";
import { readerLink, recordHref } from "../offline/links.mjs";
import { readFile } from "node:fs/promises";

test("snapshot parser keeps explicit reciprocal themes and repository-wide Markdown", () => {
  const data = buildBrainData([
    {path:"README.md", content:"# A useful title"},
    {path:"2.core/knowledge/example.md", content:"# Example\n[Theme](../themes/topic.md)"},
    {path:"2.core/themes/topic.md", content:"---\ntype: theme\n---\n# Topic\n[Example](../knowledge/example.md)"},
    {path:"2.core/themes/oneway.md", content:"---\ntype: theme\n---\n# One way\n[Example](../knowledge/example.md)"},
    {path:"2.core/memory/core.md", content:"# Memory"},
  ]);
  assert.equal(data.markdown.files.find(f=>f.path==="README.md").title, "A useful title");
  assert.ok(!data.graph.nodes.some(n=>n.path==="2.core/memory/core.md"));
  assert.deepEqual(data.graph.nodes.find(n=>n.path==="2.core/knowledge/example.md").themeIds, ["2.core/themes/topic"]);
  assert.equal(data.markdown.files.length,5);
});
test("internal links retain paths and anchors; script links and escapes are inert", () => {
  const current = "2.core/knowledge/a.md";
  assert.equal(readerLink(current,"../themes/a%20b.md#Current%20state"), recordHref("2.core/themes/a b.md","Current state"));
  assert.equal(readerLink(current,"#heading"), recordHref(current,"heading"));
  assert.equal(readerLink(current,"https://example.com"), "https://example.com");
  for (const href of ["javascript:alert(1)","data:text/html,test","//evil.test","java\nscript:alert(1)","../../../../secret.md","file:///secret.md","../image.png"]) assert.equal(readerLink(current,href),undefined);
  assert.equal(resolveRecordLink(current,"../themes/a.md"),"2.core/themes/a.md");
});
test("device state saves snapshot and credentials together, then clears both", async () => {
  const first = {snapshot:{commit:"one", files:[{content:"private fixture"}]},connection:{repository:"example/brain",token:"test-only"}};
  await saveState(first); assert.deepEqual(await readState(),first);
  // Unsupported values abort the write rather than losing the old snapshot.
  await assert.rejects(saveState({snapshot:()=>{}}));
  assert.deepEqual(await readState(),first);
  await saveState({snapshot:first.snapshot,connection:{repository:"example/brain",token:""}});
  assert.equal((await readState()).connection.token,"");
  await saveState({snapshot:null,connection:null});
  assert.deepEqual(await readState(),{snapshot:null,connection:null});
});
test("service worker caches only the shell and serves every record query from the same static page", async () => {
 const listeners = {}; const stored = new Map();
 vm.runInNewContext(await readFile(new URL("../out/sw.js", import.meta.url), "utf8"), {
 URL, Request: class { constructor(url, options) { this.url = url; this.cache = options.cache; } }, self: { location: new URL("https://example.test/sw.js"), clients: { claim: async () => {} }, addEventListener: (name, fn) => { listeners[name] = fn; } },
 caches: { open: async () => ({ addAll: async urls => urls.forEach(request => stored.set(request.url, "cached:" + request.url)), match: async url => stored.get(url) }), keys: async () => [], delete: async () => true },
 fetch: async () => "network"
 });
 await new Promise((resolve, reject) => listeners.install({ waitUntil: p => p.then(resolve, reject) }));
 function dispatch(url, mode = "cors") { let result; listeners.fetch({ request: { url, method: "GET", mode }, respondWith: p => { result = p; } }); return result; }
 assert.equal(await dispatch("https://other.test/private"), undefined);
 assert.equal(await dispatch("https://example.test/brain-data.json"), undefined);
 assert.equal(await dispatch("https://example.test" + appPath("/record/?file=private.md"), "navigate"), "cached:" + appPath("/record/index.html"));
 assert.equal(await dispatch("https://example.test" + appPath("/connection/"), "navigate"), "cached:" + appPath("/connection/index.html"));
 assert.equal(await dispatch("https://example.test" + appPath("/markdown/"), "navigate"), "cached:" + appPath("/markdown/index.html"));
});
