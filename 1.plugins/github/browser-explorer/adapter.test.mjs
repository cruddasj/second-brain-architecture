import test from "node:test";
import assert from "node:assert/strict";
import { downloadSnapshot, repositoryName, tokenValue, tokenSetupURL } from "./adapter.mjs";

const token = "github_pat_test_fixture_only";
const sha = (n) => n.toString(16).padStart(40, "0");
const files = [
  { path: "2.core/CONTRACT.md", content: "# Contract", sha: sha(10) },
  { path: "2.core/index.md", content: "# Index", sha: sha(11) },
  { path: "2.core/knowledge/example.md", content: "# Café\nUnicode ✓", sha: sha(12) },
];
function mock({ entries = files, commit = sha(1), id = 23, truncated = false, failure } = {}) {
  const calls = [];
  return { calls, request: async (url, options) => {
    calls.push({url, options});
    if (failure) return new Response("untrusted upstream error", { status: failure });
    const endpoint = new URL(url).pathname;
    let body;
    if (endpoint === "/repos/example/brain") body = { id, full_name: "example/brain", default_branch: "main" };
    else if (endpoint.endsWith("/commits/main")) body = { sha: commit, commit: { tree: { sha: sha(2) } } };
    else if (endpoint.endsWith(`/git/trees/${sha(2)}`)) body = { truncated, tree: entries.map((f) => ({ ...f, type: "blob", mode: "100644", size: Buffer.byteLength(f.content) })) };
    else {
      const entry = entries.find((f) => endpoint.endsWith(`/git/blobs/${f.sha}`));
      assert.ok(entry, `Unexpected endpoint ${endpoint}`);
      body = { encoding: "base64", content: Buffer.from(entry.content).toString("base64"), size: Buffer.byteLength(entry.content) };
    }
    return Response.json(body);
  } };
}
const options = (request, previous) => ({ repository: "example/brain", token, request, previous });
test("guided PAT URL requests read access, expiry and owner without a credential", () => {
  const url = new URL(tokenSetupURL("https://github.com/example/brain"));
  assert.equal(url.searchParams.get("contents"), "read");
  assert.equal(url.searchParams.get("expires_in"), "30");
  assert.equal(url.searchParams.get("target_name"), "example");
  assert.ok(!url.href.includes(token));
  assert.throws(() => tokenValue("ghp_classic"));
  assert.equal(repositoryName("https://github.com/example/brain.git"), "example/brain");
  for (const name of ["https://evil.test/repo", "a/../b", "a/b?x=1", "a/b#secret", "a/..", "a/b/c"]) assert.throws(() => repositoryName(name));
});
test("initial sync reads a pinned tree and blobs using GET only, with private requests uncached", async () => {
  const api = mock(); const result = await downloadSnapshot(options(api.request));
  assert.deepEqual(result.files, files);
  assert.equal(result.commit, sha(1));
  for (const {url, options} of api.calls) {
    assert.equal(new URL(url).origin, "https://api.github.com");
    assert.equal(options.method, "GET"); assert.equal(options.cache, "no-store"); assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    assert.ok(!url.includes(token));
  }
});
test("unchanged commit needs only two requests", async () => {
  const first = await downloadSnapshot(options(mock().request));
  const api = mock(); const next = await downloadSnapshot(options(api.request, first));
  assert.equal(api.calls.length, 2); assert.deepEqual(next.files, first.files);
});
test("changed snapshot reuses identical blobs and drops deleted files", async () => {
  const first = await downloadSnapshot(options(mock().request));
  const entries = [...files.slice(0,2), {path: "README.md", content: "# New", sha: sha(99)}];
  const api = mock({ entries, commit: sha(3) });
  const next = await downloadSnapshot(options(api.request, first));
  assert.equal(api.calls.filter((c) => c.url.includes("/git/blobs/")).length, 1);
  assert.deepEqual(next.files, entries); assert.equal(first.files.length, 3);
});
test("failures, cancellation, invalid repositories and oversized snapshots never mutate the previous snapshot", async () => {
  const first = await downloadSnapshot(options(mock().request));
  const before = structuredClone(first);
  for (const failure of [401,403,404,429,500]) await assert.rejects(downloadSnapshot(options(mock({failure}).request, first)));
  await assert.rejects(downloadSnapshot(options(mock({id:999}).request, first)), /different repository/);
  await assert.rejects(downloadSnapshot(options(mock({truncated:true, commit:sha(3)}).request, first)), /too large/);
  await assert.rejects(downloadSnapshot(options(mock({entries:[files[0]], commit:sha(3)}).request, first)), /does not appear/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(downloadSnapshot({...options(mock().request, first), signal: controller.signal}), {name:"AbortError"});
  assert.deepEqual(first, before);
});
