import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { findTextMatches } from "../app/record/text-matches.mjs";
import { basePath, storageScope } from "../offline/paths.mjs";

test("in-file matches use literal phrases and retain original offsets through Unicode and whitespace folding", () => {
  assert.deepEqual(findTextMatches("Café café CAFE", "cafe"), [{ start: 0, end: 4 }, { start: 5, end: 9 }, { start: 10, end: 14 }]);
  assert.deepEqual(findTextMatches("Cafe\u0301", "CAFÉ"), [{ start: 0, end: 5 }]);
  assert.deepEqual(findTextMatches("İstanbul", "istanbul"), [{ start: 0, end: 8 }]);
  assert.deepEqual(findTextMatches("𐐨𐐩𐐪", "𐐀𐐁𐐂"), [{ start: 0, end: 6 }]);
  assert.deepEqual(findTextMatches("A   golden\n dog", "golden dog"), [{ start: 4, end: 15 }]);
  assert.deepEqual(findTextMatches("a+b a.b", "a+b"), [{ start: 0, end: 3 }]);
  assert.deepEqual(findTextMatches("aaa", "aa"), [{ start: 0, end: 2 }]);
  assert.equal(findTextMatches("dog ".repeat(125), "dog").length, 125);
  for (const query of ["", " \n ", "absent", "dgo"]) assert.deepEqual(findTextMatches("dog", query), []);
});

const databaseName = `second-brain-offline-v1:${storageScope}`;
const firstPath = "manuals/first.md";
const secondPath = "manuals/second.md";
const markdown = `# Synthetic guide

## First section

A golden **dog** enjoys cafés beside a [friendly dog](#last-section).

[Another file](second.md)

<!-- hiddencomment dog -->

${Array.from({ length: 25 }, () => "An ordinary paragraph with enough text to separate the first section from the last. ".repeat(4)).join("\n\n")}

## Last section

A DOG rests here.

\`dog_code\`

| Topic | Detail |
| --- | --- |
| Example | Café in a table |

~~~js
a+b
${"x".repeat(160)} needle
~~~`;

async function seed(page, files) {
  await page.evaluate(({ databaseName, files }) => new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("state", "readwrite");
      tx.objectStore("state").put({ snapshot: { version: 1, repositoryId: 1, repository: "example/notes", branch: "main", commit: "one", checkedAt: "2026-01-01T00:00:00Z", downloadedAt: "2026-01-01T00:00:00Z", files }, connection: { repository: "example/notes" } }, "current");
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => reject(tx.error);
    };
  }), { databaseName, files });
}

test("opened Markdown searches highlight, count, scroll and navigate all rendered matches without changing the document", async (t) => {
  const addon = fileURLToPath(new URL("../", import.meta.url));
  const server = spawn(process.execPath, ["scripts/preview.mjs"], { cwd: addon, env: { ...process.env, PORT: "4210" }, stdio: "ignore" });
  t.after(() => server.kill());
  const origin = `http://127.0.0.1:4210${basePath}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin + "/")).ok) break; } catch { /* Wait for preview. */ }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin + "/connection/");
  const files = [{ path: firstPath, content: markdown }, { path: secondPath, content: "# Another guide\n\nA dog in another file." }];
  await seed(page, files);
  await page.goto(origin + "/record/?file=" + firstPath);
  const input = page.getByRole("searchbox", { name: "Search within this file" });
  const status = page.locator(".record-search-status");
  await expect(input).toBeVisible();
  const originalHTML = await page.locator(".markdown-content").innerHTML();
  await input.fill("dog");
  await expect(status).toHaveText("1 of 4 matches");
  assert.equal(await page.evaluate(() => CSS.highlights.get("record-search-matches").size), 4);
  const activeText = () => page.evaluate(() => [...CSS.highlights.get("record-search-active")][0]?.toString());
  assert.equal(await activeText(), "dog");
  await page.getByRole("button", { name: "Previous match", exact: true }).click();
  await expect(status).toHaveText("4 of 4 matches");
  await page.getByRole("button", { name: "Next match", exact: true }).click();
  await expect(status).toHaveText("1 of 4 matches");
  await input.press("Enter");
  await expect(status).toHaveText("2 of 4 matches");
  await input.press("Shift+Enter");
  await expect(status).toHaveText("1 of 4 matches");
  await input.fill("golden dog");
  await expect(status).toHaveText("1 of 1 match");
  assert.equal(await activeText(), "golden dog"); // Crosses the bold text boundary.
  await input.fill("CAFE");
  await expect(status).toHaveText("1 of 2 matches");
  await page.getByRole("button", { name: "Next match", exact: true }).click();
  assert.equal(await activeText(), "Café"); // Table cell.
  for (const query of ["hiddencomment", "second.md", "#", "dgo", "absent", "here. dog_code"]) {
    await input.fill(query);
    await expect(status).toHaveText("No matches");
    await expect(page.getByRole("button", { name: "Next match", exact: true })).toBeDisabled();
  }
  await input.fill("a+b");
  await expect(status).toHaveText("1 of 1 match");
  assert.equal(await activeText(), "a+b");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await input.fill("needle");
    await expect(status).toHaveText("1 of 1 match");
    await input.press("Enter"); // Reposition after a viewport change, even with one match.
    const bounds = await page.evaluate(() => {
      const range = [...CSS.highlights.get("record-search-active")][0].getBoundingClientRect();
      const bar = document.querySelector(".record-search-bar").getBoundingClientRect();
      const shell = document.querySelector(".record-shell").getBoundingClientRect();
      const code = document.querySelector("pre").getBoundingClientRect();
      return { match: { top: range.top, bottom: range.bottom, left: range.left, right: range.right }, bar: { top: bar.top, bottom: bar.bottom }, shell: { top: shell.top, bottom: shell.bottom }, code: { left: code.left, right: code.right }, scrollTop: document.querySelector(".record-shell").scrollTop, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.ok(bounds.scrollTop > 0);
    assert.ok(bounds.bar.top >= bounds.shell.top - 1 && bounds.bar.bottom < bounds.shell.bottom);
    assert.ok(bounds.match.top > bounds.bar.bottom && bounds.match.bottom < bounds.shell.bottom, `${width}: match is visible below sticky controls`);
    assert.ok(bounds.match.left >= bounds.code.left && bounds.match.right <= bounds.code.right, `${width}: long code line scrolls horizontally`);
    assert.equal(bounds.overflow, false);
    await expect(input).toBeVisible();
    await expect(page.getByRole("button", { name: "Next match", exact: true })).toBeVisible();
    await input.fill("");
  }
  await input.fill("dog");
  await expect(status).toHaveText("1 of 4 matches");
  await page.getByRole("button", { name: "Clear file search", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(status).toHaveText("Search this file");
  await expect.poll(() => page.evaluate(() => CSS.highlights.get("record-search-matches")?.size || 0)).toBe(0);
  assert.equal(await page.locator(".markdown-content").innerHTML(), originalHTML);
  await page.getByRole("link", { name: "Last section", exact: true }).click();
  const headingVisible = await page.evaluate(() => document.querySelector("#last-section").getBoundingClientRect().top >= document.querySelector(".record-search-bar").getBoundingClientRect().bottom);
  assert.ok(headingVisible, "Fragment navigation keeps the heading below the sticky search bar");
  await input.fill("dog");
  await expect(status).toHaveText("1 of 4 matches");
  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(status).toHaveText("Search this file");
  await input.fill("golden dog");
  await expect(status).toHaveText("1 of 1 match");
  await page.getByRole("link", { name: "Another file", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(page.locator(".markdown-content h1")).toHaveText(/Another guide/);
  await expect(status).toHaveText("Search this file");
  await context.setOffline(true);
  await page.reload();
  await input.fill("dog");
  await expect(status).toHaveText("1 of 1 match");
  await context.setOffline(false);
  await page.goto(origin + "/record/?file=missing.md");
  await expect(page.getByText("File unavailable", { exact: true })).toBeVisible();
  await expect(input).toHaveCount(0);
  assert.deepEqual(errors, []);

  const fallback = await browser.newContext();
  t.after(() => fallback.close());
  await fallback.addInitScript(() => { window.Highlight = undefined; });
  const fallbackPage = await fallback.newPage();
  await fallbackPage.goto(origin + "/connection/");
  await seed(fallbackPage, files);
  await fallbackPage.goto(origin + "/record/?file=" + firstPath);
  await fallbackPage.getByRole("searchbox", { name: "Search within this file" }).fill("dog");
  await expect(fallbackPage.locator(".record-search-status")).toHaveText("1 of 4 matches");
  await expect(fallbackPage.locator("[data-record-match-active]")).toHaveCount(1);
  await fallbackPage.getByRole("button", { name: "Previous match", exact: true }).click();
  await expect(fallbackPage.locator(".record-search-status")).toHaveText("4 of 4 matches");
  await expect(fallbackPage.locator("[data-record-match-active]")).toContainText("dog_code");
  await fallbackPage.getByRole("button", { name: "Clear file search", exact: true }).click();
  await expect(fallbackPage.locator("[data-record-match]")).toHaveCount(0);
});
