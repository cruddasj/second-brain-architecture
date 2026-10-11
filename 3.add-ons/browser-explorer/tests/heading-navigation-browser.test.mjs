import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { basePath, storageScope } from "../offline/paths.mjs";

const databaseName = `second-brain-offline-v1:${storageScope}`;
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

test("contents navigation selects short final sections and resumes tracking reader scroll", async (t) => {
  const addon = fileURLToPath(new URL("../", import.meta.url));
  const server = spawn(process.execPath, ["scripts/preview.mjs"], { cwd: addon, env: { ...process.env, PORT: "4211" }, stdio: "ignore" });
  t.after(() => server.kill());
  const origin = `http://127.0.0.1:4211${basePath}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(origin + "/")).ok) break; } catch { /* Wait for preview. */ }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(origin + "/connection/");
  const short = "# Guide\n\n## Purpose\n\nShort introduction.\n\n## Key questions\n\nA question.\n\n## Review prompts\n\n" + "- Review this decision.\n".repeat(5) + "\n## Records\n\nNo records saved.";
  const long = "# Long guide\n\n## First\n\n" + "A paragraph of ordinary text.\n\n".repeat(40) + "## Middle\n\n" + "Another paragraph.\n\n".repeat(40) + "## Last\n\nThe end.";
  await seed(page, [{ path: "short.md", sha: "short", content: short }, { path: "long.md", sha: "long", content: long }]);
  const active = page.locator('.record-toc a[aria-current="location"]');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(origin + "/record/?file=short.md");
    const records = page.getByRole("link", { name: "Records", exact: true });
    await records.click();
    await expect(active).toHaveText("Records");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#records");
    // Allow scroll and observer callbacks to settle before checking again.
    await page.waitForTimeout(250);
    await expect(active).toHaveText("Records");
    await records.click(); // Clicking the current fragment does not fire hashchange.
    await expect(active).toHaveText("Records");
    const review = page.getByRole("link", { name: "Review prompts", exact: true });
    await review.focus();
    await page.keyboard.press("Enter");
    await expect(active).toHaveText("Review prompts");
    await page.evaluate(() => { location.hash = "#records"; });
    await expect(active).toHaveText("Records");
    await page.reload();
    await expect(active).toHaveText("Records");

    await page.goto(origin + "/record/?file=long.md");
    await page.getByRole("link", { name: "Last", exact: true }).click();
    await expect(active).toHaveText("Last");
    await page.waitForTimeout(100);
    await page.locator(".record-shell").evaluate((reader) => { reader.scrollTop = 0; });
    await expect(active).toHaveText("First");
    await page.locator(".record-shell").evaluate((reader) => {
      const heading = reader.querySelector("#middle");
      const toolbar = reader.querySelector(".record-search-bar");
      reader.scrollTop += heading.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom;
    });
    await expect(active).toHaveText("Middle");
    assert.equal(await active.count(), 1);
  }
});
