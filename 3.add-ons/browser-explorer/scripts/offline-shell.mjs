import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { appPath, storageScope } from "../offline/paths.mjs";

// Generated local/demo data must never be shipped in the static application.
for (const file of ["brain-data.json", "demo-brain-data.json"]) await rm(path.join("out", file), { force: true });
const icon = await readFile("public/favicon.svg");
for (const size of [192, 512]) {
  await sharp(icon).resize(size, size).flatten({ background: "#ffffff" }).png().toFile(`out/icon-${size}.png`);
  // Inset the artwork so launcher masks cannot crop the logo's safe area.
  const artworkSize = Math.round(size * .8);
  const padding = Math.floor((size - artworkSize) / 2);
  await sharp(icon).resize(artworkSize, artworkSize)
    .extend({ top: padding, left: padding, bottom: size - artworkSize - padding, right: size - artworkSize - padding, background: "#ffffff" })
    .flatten({ background: "#ffffff" }).png().toFile(`out/icon-${size}-maskable.png`);
}
await writeFile("out/manifest.webmanifest", JSON.stringify({ id: appPath("/"), name: "Second Brain Explorer", short_name: "Second Brain", start_url: appPath("/"), scope: appPath("/"), display: "standalone", background_color: "#111719", theme_color: "#111719", icons: [192, 512].flatMap(size => [
  { src: appPath(`/icon-${size}.png`), sizes: `${size}x${size}`, type: "image/png", purpose: "any" },
  { src: appPath(`/icon-${size}-maskable.png`), sizes: `${size}x${size}`, type: "image/png", purpose: "maskable" },
]) }));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const assets = (await files("out")).filter(file => !file.endsWith(".map") && !file.endsWith("sw.js"));
const digest = createHash("sha256");
for (const file of assets.sort()) digest.update(await readFile(file));
const version = digest.digest("hex").slice(0, 16);
const urls = assets.map(file => appPath("/" + path.relative("out", file).split(path.sep).join("/")));
await writeFile("out/sw.js", `
const PREFIX = ${JSON.stringify("second-brain-shell:" + storageScope + ":")};
const CACHE = PREFIX + "${version}";
const BASE = ${JSON.stringify(appPath("/"))};
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))), self.clients.claim()])));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE) || event.request.headers?.has("authorization")) return;
  if (event.request.mode === "navigate") {
    const route = url.pathname.replace(/\\/$/, "");
    const key = route + "/index.html";
    if (!ASSETS.includes(key)) return;
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(key)) || fetch(event.request)));
  } else if (ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(event.request)));
  }
});
`);
console.log("Static installable app ready in out/. No local repository data included.");
