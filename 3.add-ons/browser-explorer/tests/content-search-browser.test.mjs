import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { storageScope, basePath } from "../offline/paths.mjs";

const addon = fileURLToPath(new URL("../", import.meta.url));
const databaseName = `second-brain-offline-v1:${storageScope}`;
const file = (path, content) => ({ path, content, sha: createHash("sha256").update(content).digest("hex") });
const snapshot = (files, commit = "one") => ({ version: 1, repositoryId: 1, repository: "example/notes", branch: "main", commit, checkedAt: "2026-01-01T00:00:00Z", downloadedAt: "2026-01-01T00:00:00Z", files });

async function seed(page, value) {
  await page.evaluate(({ databaseName, value }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put({ snapshot: value, connection: { repository: value.repository } }, "current");
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
    request.onerror = () => reject(request.error);
  }), { databaseName, value });
}

async function waitForCache(page, count) {
  await page.waitForFunction(({ databaseName, count }) => new Promise((resolve) => {
    const request = indexedDB.open(databaseName, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("state", "readonly");
      const cache = tx.objectStore("state").get("search");
      tx.oncomplete = () => { db.close(); resolve(cache.result?.index.files.length === count); };
    };
  }), { databaseName, count });
}

test("existing graph and reader controls search saved bodies, refresh the cache and work offline", async (t) => {
  const port = 4198;
  const server = spawn(process.execPath, ["scripts/preview.mjs"], { cwd: addon, env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  t.after(() => server.kill());
  const origin = `http://127.0.0.1:${port}${basePath}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin + "/")).ok) break; } catch { /* Wait for preview. */ }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const workers = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("worker", (worker) => workers.push(worker.url()));
  await page.goto(origin + "/connection/");
  const initial = snapshot([
    file("2.core/knowledge/examples/test.md", `# Sample record\n\n${"An ordinary sentence. ".repeat(30)}\nA golden dog visits cafés.\n\n~~~js\nconst unique_code = '<retained>';\n~~~`),
    file("2.core/knowledge/other/second.md", "# Another record\n\nZebras live here."),
    file("README.md", "# Library guide\n\nA dog is mentioned outside the curated graph."),
    ...Array.from({ length: 105 }, (_, i) => file(`manuals/note-${i}.md`, `# Entry ${i}\n\nSharedword in body.`)),
  ]);
  await seed(page, initial);
  await page.reload();
  await waitForCache(page, initial.files.length);
  await expect.poll(() => workers.length, { message: "The bundled search worker starts in the production shell" }).toBeGreaterThan(0);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));

  await page.goto(origin + "/markdown/");
  const readerSearch = page.getByRole("searchbox", { name: "Search Markdown files" });
  for (const query of ["DOG", "dgo", "dag", "dgog", "gold cafe", "gold cfaes", "glden cafee", "unique cdoe", "retained"]) {
    await readerSearch.fill(query);
    await expect(page.getByRole("link", { name: /Sample record/ })).toBeVisible();
    await expect(page.getByText(/Searching file content|Indexing file content/)).toHaveCount(0);
  }
  await readerSearch.fill("sharedwrod");
  await expect(page.locator(".markdown-file-link")).toHaveCount(105);
  await readerSearch.fill("test.md");
  await expect(page.getByRole("link", { name: /Sample record/ })).toBeVisible();
  await page.getByRole("link", { name: /Sample record/ }).click();
  await expect(page.locator(".markdown-content")).toContainText("golden dog");

  await page.goto(origin + "/");
  const graphSearch = page.getByLabel("Search all records");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await graphSearch.fill("dgo");
    await expect(page.locator(".graph-keyboard-nodes button")).toHaveText(["Sample record"]);
    await expect(page.getByText("No matching records")).toHaveCount(0);
    await page.getByLabel("Filter by collection", { exact: true }).selectOption("other");
    await expect(page.locator(".graph-keyboard-nodes button")).toHaveCount(0);
    await page.getByLabel("Filter by collection", { exact: true }).selectOption("all");
    await expect(page.locator(".graph-keyboard-nodes button")).toHaveText(["Sample record"]);
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await expect(page.locator(".graph-keyboard-nodes button")).toHaveCount(4);
  }
  await graphSearch.fill("dog");
  await graphSearch.fill("zebra");
  await expect(page.locator(".graph-keyboard-nodes button")).toHaveText(["Another record"]);

  // Keep the old export so only changed/added/deleted entries need indexing.
  const changed = snapshot([
    file("2.core/knowledge/examples/test.md", "# Sample record\n\nReplacementword now appears."),
    file("README.md", "# Library guide\n\nThe guide is updated."),
  ], "two");
  await seed(page, changed);
  await page.reload();
  await waitForCache(page, changed.files.length);
  await graphSearch.fill("dog");
  await expect(page.getByText("No matching records")).toBeVisible();
  await graphSearch.fill("replacementwrod");
  await expect(page.locator(".graph-keyboard-nodes button")).toHaveText(["Sample record"]);

  await context.setOffline(true);
  await page.reload();
  await graphSearch.fill("replacementwrod");
  await expect(page.locator(".graph-keyboard-nodes button")).toHaveText(["Sample record"]);
  await page.getByRole("link", { name: "Markdown reader", exact: true }).click();
  await readerSearch.fill("replacementwrod");
  await expect(page.getByRole("link", { name: /Sample record/ })).toBeVisible();
  await context.setOffline(false);
  await page.goto(origin + "/connection/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Disconnect and clear device copy", exact: true }).click();
  await expect(page.getByText("Connection and downloaded content removed from this browser.")).toBeVisible();
  const savedCache = await page.evaluate((databaseName) => new Promise((resolve) => {
    const request = indexedDB.open(databaseName, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("state", "readonly");
      const cache = tx.objectStore("state").get("search");
      tx.oncomplete = () => { db.close(); resolve(cache.result ?? null); };
    };
  }), databaseName);
  assert.equal(savedCache, null);
  assert.deepEqual(errors, []);

  const delayedContext = await browser.newContext();
  t.after(() => delayedContext.close());
  await delayedContext.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      queries = new Map();
      postMessage(message) {
        if (message.type === "search") this.queries.set(message.id, message.query);
        super.postMessage(message);
      }
      set onmessage(handler) {
        super.onmessage = (event) => {
          if (this.queries.get(event.data.id) === "dog") {
            window.delayedDog = true;
            setTimeout(() => handler(event), 350);
          } else handler(event);
        };
      }
    };
  });
  const delayedPage = await delayedContext.newPage();
  await delayedPage.goto(origin + "/markdown/");
  await seed(delayedPage, initial);
  await delayedPage.reload();
  const delayedSearch = delayedPage.getByRole("searchbox", { name: "Search Markdown files" });
  await delayedSearch.fill("dog");
  await delayedPage.waitForFunction(() => window.delayedDog);
  await delayedSearch.fill("zebra");
  await expect(delayedPage.locator(".markdown-file-link")).toHaveText(["Another record2.core/knowledge/other/second.md"]);
  await delayedPage.waitForTimeout(400); // Deliver the obsolete dog response after the zebra response.
  await expect(delayedPage.locator(".markdown-file-link")).toHaveText(["Another record2.core/knowledge/other/second.md"]);

  // Browsers with disabled workers still search the saved Markdown.
  const fallbackContext = await browser.newContext();
  t.after(() => fallbackContext.close());
  await fallbackContext.addInitScript(() => { window.Worker = class { constructor() { throw new Error("Worker disabled in test"); } }; });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.goto(origin + "/markdown/");
  await seed(fallbackPage, changed);
  await fallbackPage.reload();
  await fallbackPage.getByRole("searchbox", { name: "Search Markdown files" }).fill("replacementwrod");
  await expect(fallbackPage.getByRole("link", { name: /Sample record/ })).toBeVisible();
  await fallbackPage.goto(origin + "/");
  await fallbackPage.getByLabel("Search all records").fill("replacementwrod");
  await expect(fallbackPage.locator(".graph-keyboard-nodes button")).toHaveText(["Sample record"]);
});
