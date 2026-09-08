import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const root = path.resolve("out");
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const port = Number(process.env.PORT || 4173);
http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (basePath && !pathname.startsWith(basePath + "/")) throw new Error();
    pathname = pathname.slice(basePath.length);
    let file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error();
    if ((await stat(file + ".html").catch(() => null))?.isFile()) file += ".html";
    else if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, "index.html");
    else if (!path.extname(file)) file += ".html";
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch { response.writeHead(404).end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`Open http://localhost:${port}${basePath}/connection/ to test setup and installation.`));
