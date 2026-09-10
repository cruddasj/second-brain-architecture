import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const addon = new URL("../../../3.add-ons/browser-explorer/", import.meta.url);
const require = createRequire(new URL("package.json", addon));
const { chromium } = require("@playwright/test");
const sha = n => n.toString(16).padStart(40, "0");
test("installed shell syncs a remote fixture into graph and reader, refreshes atomically, and reads offline", async t => {
  const port = 4197;
  const server = spawn(process.execPath, ["scripts/preview.mjs"], { cwd: fileURLToPath(addon), env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  t.after(() => server.kill());
  const origin = `http://127.0.0.1:${port}${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(origin + "/")).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 50)); }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let revision = 1, failure = false, calls = 0;
  const entries = () => [
    { path: "2.core/CONTRACT.md", content: "# Contract", sha: sha(10) },
    { path: "2.core/index.md", content: "# Index", sha: sha(11) },
    { path: "2.core/knowledge/remote-only.md", content: `# Remote-only fixture\n\n## Description\n\nRemote revision ${revision}\n\n## Links\n\n[Index](../index.md)\n\n[Unsafe](javascript:alert)\n`, sha: sha(20 + revision) },
  ];
  await context.route("https://api.github.com/**", async route => {
    calls++;
    assert.equal(route.request().method(), "GET");
    assert.equal(route.request().headers().authorization, "Bearer github_pat_fixture_only");
    if (failure) { await route.fulfill({ status: 401, body: "{}" }); return; }
    const pathname = new URL(route.request().url()).pathname;
    let body;
    if (pathname === "/repos/example/brain") body = { id: 123, full_name: "example/brain", default_branch: "main" };
    else if (pathname.endsWith("/commits/main")) body = { sha: sha(revision), commit: { tree: { sha: sha(2) } } };
    else if (pathname.includes("/git/trees/")) body = { tree: entries().map(file => ({ ...file, type: "blob", mode: "100644", size: Buffer.byteLength(file.content) })) };
    else { const file = entries().find(file => pathname.endsWith(file.sha)); assert.ok(file); body = { encoding: "base64", content: Buffer.from(file.content).toString("base64"), size: Buffer.byteLength(file.content) }; }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto(origin + "/connection");
  await page.getByRole("button", { name: "Connect and sync" }).waitFor();
  const manifest = await (await fetch(origin + "/manifest.webmanifest")).json();
  assert.equal(manifest.display, "standalone");
  for (const purpose of ["any", "maskable"]) {
    assert.deepEqual(manifest.icons.filter(icon => icon.purpose === purpose).map(icon => icon.sizes).sort(), ["192x192", "512x512"], `Expected both install icon sizes for ${purpose}`);
  }
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(300); // Let the existing responsive panel transition settle.
    const heading = await page.locator(".reader-header").boundingBox();
    const input = await page.getByLabel("GitHub repository", { exact: true }).boundingBox();
    assert.ok(input.x >= heading.x && input.width > 0, "Setup inputs remain within the reader content");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
  }
  await page.setViewportSize({ width: 1280, height: 844 });
  assert.equal(await page.getByText("Development mode - using your local content").count(), 0);
  await page.getByLabel("GitHub repository", { exact: true }).fill("example/brain");
  await page.getByLabel("Paste your token", { exact: true }).fill("github_pat_fixture_only");
  const remember = page.getByRole("button", { name: "Remember token on this device", exact: true });
  assert.equal(await remember.getAttribute("aria-pressed"), "false");
  assert.equal(await remember.evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  await remember.click();
  assert.equal(await remember.getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(250); // Existing button fill transition lasts 200 ms.
  assert.notEqual(await remember.evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
  await remember.press("Space");
  assert.equal(await remember.getAttribute("aria-pressed"), "false");
  await remember.press("Enter");
  assert.equal(await remember.getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Connect and sync" }).click();
  await page.getByRole("heading", { name: "Connected to example/brain" }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.goto(origin + "/markdown");
  await page.getByLabel("Search Markdown files").fill("Remote-only");
  await page.getByRole("link", { name: /Remote-only fixture/ }).click();
  await page.getByText("Remote revision 1", { exact: true }).waitFor();
  assert.equal(await page.getByText("Unsafe", { exact: true }).getAttribute("href"), null);
  await page.goto(origin + "/");
  await page.getByRole("button", { name: /Remote-only fixture/ }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const information = page.getByRole("button", { name: "Node information", exact: true });
  assert.equal(await information.count(), 0, "Selection controls start hidden");
  await page.getByRole("button", { name: /Remote-only fixture/ }).press("Enter");
  await information.waitFor();
  assert.equal(await page.getByRole("button", { name: "Node details", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Back to graph", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Focus on neighbours", exact: true }).click();
  const fullGraph = page.getByRole("button", { name: "Show full graph", exact: true });
  assert.equal(await fullGraph.getAttribute("aria-pressed"), "true");
  await fullGraph.click();
  await information.click();
  const dialog = page.getByRole("dialog", { name: "Node information" });
  await dialog.waitFor();
  await dialog.getByRole("heading", { name: "Remote-only fixture", exact: true }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: /Focus on neighbours|Show full graph/ }).count(), 0);
  await dialog.getByRole("button", { name: "Close node information" }).click();
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await information.evaluate(element => document.activeElement === element), true);
  await information.click();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), false);
  await information.click();
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.waitForFunction(() => !document.querySelector("#mobile-node-information").open);
  assert.equal(await information.isVisible(), false);
  await page.getByRole("button", { name: "Focus on neighbours", exact: true }).waitFor();

  await page.goto(origin + "/connection");
  revision = 2;
  await page.getByRole("button", { name: "Refresh content" }).click();
  await page.getByText(/Synced 3 Markdown files/).waitFor();
  await page.goto(origin + "/record?file=2.core%2Fknowledge%2Fremote-only.md");
  await page.getByText("Remote revision 2", { exact: true }).waitFor();
  await page.goto(origin + "/connection");
  failure = true;
  await page.getByRole("button", { name: "Refresh content" }).click();
  await page.getByText(/Your token has expired/).waitFor();
  const beforeOffline = calls;
  await context.setOffline(true);
  await page.goto(origin + "/markdown");
  await page.getByLabel("Search Markdown files").fill("Remote-only");
  await page.getByRole("link", { name: /Remote-only fixture/ }).click();
  await page.getByText("Remote revision 2", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("Remote revision 2", { exact: true }).waitFor();
  assert.equal(calls, beforeOffline);
  assert.deepEqual(errors, []);
  await context.setOffline(false);
  await page.goto(origin + "/connection");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Disconnect and clear device copy" }).click();
  await page.getByText("Connection and downloaded content removed from this browser.").waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Connect and sync" }).waitFor();
  assert.equal(await page.getByLabel("Paste your token", { exact: true }).inputValue(), "");
});

test("development clearly uses local Markdown and skips token setup", async t => {
  const port = 4198;
  const server = process.env.EXPLORER_DEV_ORIGIN ? null : spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(addon), stdio: "ignore" });
  t.after(() => {
    if (!server) return;
    if (process.platform === "win32") { try { execFileSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
    else server.kill();
  });
  const origin = process.env.EXPLORER_DEV_ORIGIN || `http://127.0.0.1:${port}${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;
  for (let i = 0; i < 200; i++) { try { if ((await fetch(origin + "/")).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 50)); }
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.goto(origin + "/connection");
  await page.getByRole("heading", { name: "Development mode - using your local content" }).waitFor();
  assert.equal(await page.locator('input[type="password"]').count(), 0);
  const data = await (await fetch(origin + "/brain-data.json")).json();
  assert.ok(data.snapshot.files.length > 0);
  const file = data.snapshot.files.find(file => file.path === "README.md");
  assert.ok(file);
  await page.goto(origin + "/record?file=README.md");
  await page.locator(".markdown-content h1").waitFor();
  assert.equal(await page.getByRole("heading", { name: "File unavailable" }).count(), 0);
});
