import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
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
  assert.equal(await information.getAttribute("aria-pressed"), "false");
  assert.equal(await information.locator("i").evaluate(el => getComputedStyle(el).animationName), "node-action-pulse");
  const menuIcons = await page.locator(".navigation-icon").evaluateAll(icons => icons.map(el => getComputedStyle(el).fontSize));
  assert.equal(new Set(menuIcons).size, 1, "Mobile connection arrows match the other menu icon sizes");
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
  assert.equal(await information.getAttribute("aria-pressed"), "true", "Closing details keeps automatic information enabled");
  const anotherNode = page.locator(".graph-keyboard-nodes button").filter({ hasNotText: "Remote-only fixture" }).first();
  const anotherTitle = await anotherNode.textContent();
  await anotherNode.press("Enter");
  await dialog.getByRole("heading", { name: anotherTitle, exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await information.getAttribute("aria-pressed"), "true", "Escape also preserves automatic information");
  await information.click();
  assert.equal(await information.getAttribute("aria-pressed"), "false");
  await page.getByRole("button", { name: /Remote-only fixture/ }).press("Enter");
  assert.equal(await dialog.isVisible(), false, "Disabled information stays closed on selection");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await information.locator("i").evaluate(el => getComputedStyle(el).animationName), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await information.click();
  await dialog.waitFor();
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.waitForFunction(() => !document.querySelector("#mobile-node-information").open);
  assert.equal(await information.isVisible(), false);
  await page.getByRole("button", { name: "Focus on neighbours", exact: true }).waitFor();

  // Navigate through the real bottom menu, including changing available phone
  // height between documents. The content and menu must share one boundary.
  for (const height of [780, 700, 844]) {
    await page.setViewportSize({ width: 360, height });
    for (const name of ["Markdown reader", "Repository sync", "Knowledge graph"]) {
      await page.getByRole("navigation", { name: "Explorer destinations" }).getByRole("link", { name, exact: true }).click();
      await page.locator(".workspace-pane > *").first().waitFor();
      await page.waitForTimeout(250);
      const bounds = await page.evaluate(() => {
        const menu = document.querySelector(".navigation-panel").getBoundingClientRect();
        const pane = document.querySelector(".workspace-pane").getBoundingClientRect();
        const content = document.querySelector(".workspace-pane > *").getBoundingClientRect();
        return { menuTop: menu.top, menuBottom: menu.bottom, paneBottom: pane.bottom, contentBottom: content.bottom, viewportHeight: innerHeight, scrollHeight: document.documentElement.scrollHeight };
      });
      assert.ok(bounds.contentBottom <= bounds.menuTop, `${name}: content clears the bottom menu`);
      assert.ok(Math.abs(bounds.paneBottom - bounds.menuTop) <= 1, `${name}: pane ends at the menu`);
      assert.ok(Math.abs(bounds.menuBottom - bounds.viewportHeight) <= 1, `${name}: menu stays at the viewport bottom`);
      assert.ok(bounds.scrollHeight <= bounds.viewportHeight, `${name}: no outer page scrolling`);
    }
  }
  await page.setViewportSize({ width: 1280, height: 844 });

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


test("installed shell updates preserve device data and recover from failed downloads", async t => {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const prefix = `second-brain-shell:${encodeURIComponent(base || "/")}:`;
  const output = new URL("out/", addon);
  let version = 1, failDownload = false;
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (!pathname.startsWith(base + "/")) { response.writeHead(404).end(); return; }
      let file = pathname.slice(base.length + 1);
      if (!file || file.endsWith("/")) file += "index.html";
      else if (!path.extname(file)) file += "/index.html";
      const target = new URL(file, output);
      if (!target.href.startsWith(output.href)) { response.writeHead(404).end(); return; }
      if (failDownload && file === "favicon.svg") { response.writeHead(503).end(); return; }
      let body = await readFile(target);
      if (file === "sw.js") body = Buffer.from(body.toString().replace('const CACHE = PREFIX + "', `const CACHE = PREFIX + "test-v${version}-`));
      if (file === "connection/index.html") body = Buffer.from(body.toString().replace("</head>", `<meta name="app-update-fixture" content="${version}"></head>`));
      const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
      response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const origin = `http://127.0.0.1:${server.address().port}${base}`;
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  const page = await context.newPage();
  await page.goto(origin + "/connection/");
  await page.getByRole("heading", { name: "Update Second Brain Explorer" }).waitFor();
  assert.equal(await page.locator('meta[name="app-update-fixture"]').getAttribute("content"), "1");
  assert.equal(await page.getByRole("heading", { name: "Install Second Brain Explorer" }).count(), 0);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const saved = { snapshot: { repository: "example/brain", branch: "main", commit: sha(1), checkedAt: "2026-09-10T00:00:00Z", files: [{ path: "README.md", content: "# Preserved note", sha: sha(2) }] }, connection: { repository: "example/brain", token: "fixture-only" } };
  const scope = encodeURIComponent(base || "/");
  await page.evaluate(async ({ saved, scope, prefix, origin }) => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open(`second-brain-offline-v1:${scope}`, 1); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => { const tx = db.transaction("state", "readwrite"); tx.objectStore("state").put(saved, "current"); tx.oncomplete = resolve; tx.onerror = reject; });
    db.close();
    localStorage.setItem(`second-brain-graph-positions-v1:${scope}`, JSON.stringify({ node: { x: 123, y: 456 } }));
    const cache = await caches.open((await caches.keys()).find(key => key.startsWith(prefix)));
    await cache.put(origin + "/favicon.svg", new Response("stale-shell"));
    await (await caches.open(prefix + "obsolete")).put(origin + "/old.js", new Response("old"));
    await caches.open("second-brain-shell:other-app:keep");
  }, { saved, scope, prefix, origin });
  await page.reload();
  await page.getByRole("heading", { name: "Connected to example/brain" }).waitFor();
  const state = () => page.evaluate(async scope => {
    const db = await new Promise(resolve => { const request = indexedDB.open(`second-brain-offline-v1:${scope}`, 1); request.onsuccess = () => resolve(request.result); });
    const value = await new Promise(resolve => { const request = db.transaction("state").objectStore("state").get("current"); request.onsuccess = () => resolve(request.result); });
    db.close();
    return { saved: value, layout: localStorage.getItem(`second-brain-graph-positions-v1:${scope}`) };
  }, scope);
  const before = await state();
  const update = page.getByRole("button", { name: "Update app", exact: true });
  failDownload = true;
  await update.click();
  await page.getByText(/The app could not be downloaded/).waitFor();
  assert.deepEqual(await state(), before);
  assert.ok((await page.evaluate(() => caches.keys())).includes(prefix + "obsolete"));
  assert.equal(await page.evaluate(async origin => (await (await caches.match(origin + "/favicon.svg")).text()), origin), "stale-shell");
  failDownload = false;
  await Promise.all([page.waitForEvent("load"), update.click()]);
  await page.getByRole("heading", { name: "Connected to example/brain" }).waitFor();
  assert.deepEqual(await state(), before);
  let keys = await page.evaluate(() => caches.keys());
  assert.ok(!keys.includes(prefix + "obsolete"));
  assert.ok(keys.includes("second-brain-shell:other-app:keep"));
  assert.notEqual(await page.evaluate(async origin => (await (await caches.match(origin + "/favicon.svg")).text()), origin), "stale-shell");
  version = 2;
  await Promise.all([page.waitForEvent("load"), update.click()]);
  await page.getByRole("heading", { name: "Connected to example/brain" }).waitFor();
  assert.deepEqual(await state(), before);
  keys = await page.evaluate(() => caches.keys());
  assert.equal(keys.filter(key => key.startsWith(prefix)).length, 1);
  assert.ok(keys.some(key => key.startsWith(prefix + "test-v2-")));
  assert.equal(await page.locator('meta[name="app-update-fixture"]').getAttribute("content"), "2");
  assert.ok(keys.includes("second-brain-shell:other-app:keep"));
  await context.setOffline(true);
  await update.click();
  await page.getByText(/You're offline/).waitFor();
  assert.deepEqual(await state(), before);
  await page.goto(origin + "/record/?file=README.md");
  await page.getByRole("heading", { name: /^Preserved note/ }).waitFor();
});
