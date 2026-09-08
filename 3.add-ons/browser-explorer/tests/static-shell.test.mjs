import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { appPath } from "../offline/paths.mjs";
import { recordHref } from "../offline/links.mjs";

const output = new URL("../out/", import.meta.url);
test("export is an empty shell with mount-relative navigation and installation assets", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", output), "utf8"));
  assert.equal(manifest.start_url, appPath("/"));
  assert.equal(manifest.scope, appPath("/"));
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith(appPath("/")));
    await readFile(new URL(icon.src.slice(appPath("/").length), output));
  }
  for (const route of ["", "connection/", "markdown/", "record/"]) {
    const html = await readFile(new URL(route + "index.html", output), "utf8");
    assert.ok(html.includes(appPath("/manifest.webmanifest")));
    for (const match of html.replace(/<link[^>]+rel="preconnect"[^>]*>/g, "").matchAll(/(?:src|href)="(\/[^"<>]*)"/g)) {
      assert.ok(match[1].startsWith(appPath("/")), `Asset or link escaped mount: ${match[1]}`);
    }
  }
  assert.equal(recordHref("folder/a b.md", "Details"), appPath("/record/?file=folder%2Fa%20b.md#Details"));
  const entries = await readdir(output, { recursive: true });
  assert.ok(!entries.some(file => /brain-data\.json|\.md$|(^|\/)2\.core(\/|$)/.test(file)));
});
