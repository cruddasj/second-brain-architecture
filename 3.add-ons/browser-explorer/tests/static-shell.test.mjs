import test from "node:test";
import sharp from "sharp";
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

test("maskable install icons keep the logo inside the circular safe zone on white", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", output), "utf8"));
  const icons = manifest.icons.filter(icon => icon.purpose === "maskable");
  assert.deepEqual(icons.map(icon => icon.sizes).sort(), ["192x192", "512x512"]);
  const serviceWorker = await readFile(new URL("sw.js", output), "utf8");
  for (const icon of icons) {
    assert.ok(serviceWorker.includes(icon.src), "Maskable icon must be cached offline");
    const buffer = await readFile(new URL(icon.src.slice(appPath("/").length), output));
    const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal((await sharp(buffer).stats()).isOpaque, true);
    assert.equal(`${info.width}x${info.height}`, icon.sizes);
    let artworkPixels = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels;
      if (data[offset] === 255 && data[offset + 1] === 255 && data[offset + 2] === 255) continue;
      artworkPixels++;
      assert.ok(Math.hypot(x + .5 - info.width / 2, y + .5 - info.height / 2) <= info.width * .4, "Logo must survive the minimum circular mask");
    }
    assert.ok(artworkPixels > info.width * info.height * .02, "Icon must retain visible artwork");
  }
});
