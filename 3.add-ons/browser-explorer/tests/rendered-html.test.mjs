import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function productionServer() {
 const port = await new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
   const address = server.address();
   server.close((error) => error ? reject(error) : resolve(address.port));
  });
 });
 const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
 const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd, stdio: "ignore" });
 const origin = `http://127.0.0.1:${port}`;
 for (let attempt = 0; attempt < 100; attempt += 1) {
  if (child.exitCode !== null) throw new Error(`Next.js server exited with code ${child.exitCode}`);
  try {
   const response = await fetch(origin);
   if (response.ok) return { child, origin };
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 50));
 }
 child.kill();
 throw new Error("Timed out waiting for the Next.js server");
}
test("production build renders the graph-focused explorer shell", async () => {
 const html=await readFile(new URL("../.next/server/app/index.html",import.meta.url),"utf8");
 assert.match(html,/<title>Second Brain Explorer<\/title>/); assert.doesNotMatch(html,/Private knowledge workspace|Collapse menu/);assert.match(html,/<h1>Second Brain Explorer<\/h1>/); assert.match(html,/Knowledge graph/); assert.doesNotMatch(html,/Switch to (?:dark|light) mode/); assert.doesNotMatch(html,/Read-only Core records|class="brand-mark"/); assert.doesNotMatch(html,/Skill Studio/);
});
test("Cytoscape owns graph rendering for the lifetime of the component", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/cytoscape\(\{/);assert.match(source,/container: containerRef\.current/);assert.match(source,/cyRef\.current = cy/);assert.match(source,/cy\.destroy\(\)/);assert.doesNotMatch(source,/<svg|<line|<circle|<path/);});
test("Cytoscape tracks its responsive canvas before rendering graph data", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(source,/new ResizeObserver\(\(\) => cy\.resize\(\)\)/);assert.match(source,/resizeObserver\.observe\(containerRef\.current\)/);assert.match(source,/resizeObserver\.disconnect\(\)/);assert.match(source,/cy\.resize\(\);\s*cy\.elements\(\)\.remove\(\)/);assert.match(css,/\.cytoscape-graph \{ position: absolute; inset: 0;/);});
test("graph data becomes Cytoscape nodes and both kinds of edges", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/graph\.nodes\.map/);assert.match(source,/group: "nodes"/);assert.match(source,/graph\.edges\.map/);assert.match(source,/group: "edges"/);assert.match(source,/classes: edge\.kind/);assert.match(source,/"collection" \| "reference"/);});
test("saved positions support drag and keyboard movement without an automatic overwrite", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/layout: \{ name: "preset" \}/);assert.match(source,/cy\.on\("free", "node"/);assert.match(source,/localStorage\.setItem\(storageKey/);assert.match(source,/const hasSavedPositions = Object\.keys\(saved\)\.length > 0/);assert.match(source,/position: existing\[node\.id\] \|\| saved\[node\.id\]/);assert.match(source,/if \(hasSavedPositions\) cy\.fit\(cy\.nodes\(":visible"\), fitPadding\);\s*else arrangeGraph\(\)/);assert.match(source,/ArrowLeft/);assert.match(source,/event\.shiftKey/);});
test("Arrange graph uses a spacious animated cose layout over visible elements", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/function|const arrangeGraph/);assert.match(source,/cy\.nodes\(":visible"\)/);assert.match(source,/visibleNodes\.union\(cy\.edges\(":visible"\)\)/);assert.match(source,/name: "cose"/);assert.match(source,/nodeRepulsion: 12000/);assert.match(source,/idealEdgeLength: 150/);assert.match(source,/nodeOverlap: 32/);assert.match(source,/gravity: \.18/);assert.match(source,/padding: fitPadding/);assert.match(source,/animate: true/);assert.match(source,/fit: true/);assert.match(source,/aria-label="Arrange graph" title="Arrange graph"/);assert.match(source,/cy\.fit\(visibleNodes, fitPadding\)/);});
test("Arrange graph is the only automatic layout control and persists stable results", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/layout\.one\("layoutstop"/);assert.match(source,/visibleNodes\.forEach[\s\S]*saved\[node\.id\(\)\] = node\.position\(\)/);assert.doesNotMatch(source,/resetLayout|Reset layout|fa-rotate-left/);});
test("search and collection filters are overlaid inside the graph canvas", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(source,/className="graph-stage">\s*<div className="graph-controls"/);assert.match(css,/\.graph-controls, \.graph-actions \{ position: absolute/);assert.doesNotMatch(source,/graph-toolbar/);});
test("collection filter precedes search and controls use Font Awesome icons", async()=>{const graph=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const page=await readFile(new URL("../app/application-shell.tsx",import.meta.url),"utf8");const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8");assert.match(graph,/className="graph-controls"><select[\s\S]*?<label>/);assert.match(page,/fa-solid fa-bars/);assert.match(graph,/fa-solid fa-plus/);assert.match(layout,/fontawesome\.com\/releases\/v6\.7\.2\/css\/all\.css/);});
test("collection filter preserves collection node title casing", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/label: node\.title/);assert.match(source,/<option key=\{value\} value=\{value\}>\{label\}<\/option>/);});
test("search exposes an accessible, theme-styled clear button without covering its text", async()=>{const graph=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(graph,/query && <button type="button" className="search-clear"/);assert.match(graph,/onClick=\{\(\) => setQuery\(""\)\}/);assert.match(graph,/aria-label="Clear search"/);assert.match(graph,/className="search-clear-icon" aria-hidden="true"/);assert.match(css,/\.graph-controls input \{[^}]*padding: 0 40px 0 14px/);assert.match(css,/\.graph-controls \.search-clear \{[^}]*position: absolute[^}]*background: var\(--primary-container\)[^}]*color: var\(--on-primary-container\)/);assert.match(css,/\.search-clear-icon \{[^}]*display: block[^}]*width: 11px[^}]*height: 11px/);assert.match(css,/\.search-clear-icon::before \{ transform: rotate\(45deg\)/);assert.match(css,/\.search-clear-icon::after \{ transform: rotate\(-45deg\)/);});
test("graph filters use a quiet focus state and give the collection arrow room", async()=>{const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(css,/\.graph-controls select \{[^}]*appearance: none/);assert.match(css,/\.graph-controls select \{[^}]*padding: 0 50px 0 12px/);assert.match(css,/\.graph-controls select \{[^}]*background-position: right 20px center/);assert.match(css,/\.graph-controls input:focus-visible, \.graph-controls select:focus-visible \{ outline: none; \}/);assert.match(css,/\.graph-controls input:focus, \.graph-controls select:focus \{ background-color: rgba\(255, 255, 255, \.05\); \}/);});
test("Cytoscape configures native panning and bounded pointer zoom", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/panningEnabled: true/);assert.match(source,/userPanningEnabled: true/);assert.match(source,/userZoomingEnabled: true/);assert.match(source,/minZoom/);assert.match(source,/maxZoom/);assert.match(source,/renderedPosition/);assert.match(source,/zoomBy\(\.15\)/);assert.match(source,/zoomBy\(-\.15\)/);});
test("the initial viewport fits visible nodes with room for labels", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/const fitPadding = 72/);assert.match(source,/hasInitialFitRef/);assert.match(source,/cy\.fit\(cy\.nodes\(":visible"\), fitPadding\)/);});
test("selection opens details while filters and neighbour focus update Cytoscape visibility", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/cy\.on\("tap", "node", \(event\) => \{ setSelectedId\(event\.target\.id\(\)\); setDetailOpen\(true\); \}\)/);assert.match(source,/Filter by collection/);assert.match(source,/Search all records/);assert.match(source,/node\.style\("display"/);assert.match(source,/toggleClass\("focus-hidden"/);assert.match(source,/Focus on neighbours/);assert.match(source,/Show full graph/);});
test("selected nodes use a pulsing circular halo without a pointer-down box", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/"underlay-shape": "ellipse"/);assert.match(source,/"underlay-color": "#d9dde0"/);assert.match(source,/"overlay-opacity": 0/);assert.match(source,/requestAnimationFrame\(pulse\)/);assert.match(source,/prefers-reduced-motion: reduce/);assert.match(source,/className="detail-content">\{selected \? <>\s*<button[^>]*>[\s\S]*?Focus on neighbours/);});
test("keyboard node controls expose names, counts, selection, and visible focus", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/role="img"/);assert.match(source,/visible nodes/);assert.match(source,/graph-keyboard-nodes/);assert.match(source,/aria-label=.*Use arrow keys to move/);assert.match(source,/aria-pressed/);assert.match(source,/keyboard-focus/);assert.match(source,/Enter/);assert.match(source,/event\.key === " "/);});
test("Cytoscape styling preserves translucent palettes, node kinds, edge kinds, and theme pies", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/"background-opacity": \.76/);assert.match(source,/pie-1-background-color/);assert.match(source,/pie-7-background-size/);assert.match(source,/node\.collection/);assert.match(source,/node\.theme/);assert.match(source,/shape: "diamond"/);assert.match(source,/edge\.reference/);assert.match(source,/"line-style": "dashed"/);assert.match(source,/#2f7fc1/);assert.match(source,/#35b8b4/);assert.match(source,/#c4c966/);});
test("appearance is dark-only with no theme persistence or toggle", async()=>{const source=await readFile(new URL("../app/page.tsx",import.meta.url),"utf8");const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.doesNotMatch(source,/second-brain-theme|toggleTheme|theme-toggle/);assert.doesNotMatch(layout,/second-brain-theme|prefers-color-scheme/);assert.match(css,/:root \{\s*color-scheme: dark/);assert.doesNotMatch(css,/data-theme|color-scheme: light/);});

test("desktop layout uses a viewport-height graph between collapsible side panels", async()=>{const page=await readFile(new URL("../app/application-shell.tsx",import.meta.url),"utf8");const graph=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(page,/Collapse navigation panel/);assert.match(page,/navigation-collapsed/);assert.match(graph,/Collapse node information panel/);assert.match(graph,/detail-collapsed/);assert.match(css,/height: 100dvh/);assert.match(css,/body:has\(\.brain-shell\) \{ overflow: hidden/);});

test("desktop navigation overlays the graph while its collapsed rail reserves canvas space", async()=>{const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(css,/\.brain-shell \{ position: relative;/);assert.match(css,/\.navigation-panel \{ position: absolute;[^}]*width: 300px;/);assert.match(css,/\.navigation-collapsed \.navigation-panel \{ width: 72px;/);assert.match(css,/\.workspace-pane \{[^}]*padding: 16px 16px 16px 316px;/);assert.match(css,/\.graph-stage-wrap \{ position: relative; display: grid; grid-template-columns: minmax\(0, 1fr\) 315px;/);assert.match(css,/\.graph-workspace\.detail-collapsed \.graph-stage-wrap \{ grid-template-columns: minmax\(0, 1fr\) 64px;/);assert.match(css,/\.graph-detail \{ position: relative;[^}]*width: 315px;/);assert.match(css,/\.detail-collapsed \.graph-detail \{ width: 64px;/);});

test("navigation starts collapsed and development indicators are disabled", async()=>{const page=await readFile(new URL("../app/application-shell.tsx",import.meta.url),"utf8");const config=await readFile(new URL("../next.config.ts",import.meta.url),"utf8");assert.match(page,/useState\(false\)/);assert.match(config,/devIndicators: false/);});

test("detail panel prevents horizontal scrolling and graph legend mirrors node fills", async()=>{const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(css,/\.graph-detail \{[^}]*overflow-x: hidden/);assert.match(css,/\.detail-content \{ min-width: 0; overflow-wrap: anywhere/);assert.match(css,/\.legend-theme \{[^}]*background: #35b8b4/);assert.match(css,/\.legend-collection \{ background: #f4f1ef/);});

test("panel controls occupy dedicated headers instead of overlapping content", async()=>{const page=await readFile(new URL("../app/application-shell.tsx",import.meta.url),"utf8");const graph=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(page,/className="navigation-header"/);assert.match(graph,/className="detail-panel-header"/);assert.match(css,/\.navigation-header \{ display: flex/);assert.match(css,/\.detail-panel-header \{ display: flex/);assert.doesNotMatch(css,/\.detail-toggle \{ position: absolute/);});

test("desktop navigation toggle stays fixed while its panel expands", async()=>{const page=await readFile(new URL("../app/application-shell.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(page,/navigationOpen \? "navigation-expanded" : "navigation-collapsed"/);assert.match(css,/@media \(min-width: 901px\) \{\s*\.navigation-expanded \.navigation-header \.navigation-toggle \{ margin-left: 4px; \}/);});

test("dark appearance uses Material elevation surfaces and a text-based neutral favicon", async()=>{const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");const layout=await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8");const favicon=await readFile(new URL("../public/favicon.svg",import.meta.url),"utf8");assert.match(css,/--canvas: #121212/);assert.match(css,/5% white overlay \/ 1dp/);assert.match(css,/--text: rgba\(255, 255, 255, \.87\)/);assert.match(layout,/favicon\.svg/);assert.match(favicon,/<svg/);assert.match(favicon,/#4f378b/);});

test("selected nodes expose links to associated Markdown files", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/Associated Markdown files/);assert.match(source,/href={`\/records\//);assert.match(source,/target="_blank"/);});

test("selected records present dates and sources separately from their summary", async()=>{const source=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");assert.match(source,/className="detail-metadata"/);assert.match(source,/Last confirmed/);assert.match(source,/month: "long"/);});

test("record pages render styled Markdown with graph navigation", async()=>{const page=await readFile(new URL("../app/records/[...path]/page.tsx",import.meta.url),"utf8");const renderer=await readFile(new URL("../app/records/[...path]/markdown-content.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.doesNotMatch(page,/Back to knowledge graph/);assert.match(page,/ApplicationShell/);assert.match(page,/MarkdownContent/);assert.match(renderer,/type: "heading"/);assert.match(renderer,/type: "table"/);assert.match(css,/\.markdown-content h1/);});

test("event log entries use the same card and metadata-table treatment as current state", async()=>{const renderer=await readFile(new URL("../app/records/[...path]/markdown-content.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(renderer,/function eventItem/);assert.match(renderer,/className="event-list"/);assert.match(renderer,/className="event-metadata-wrap"/);assert.match(renderer,/aria-label="Event metadata"/);assert.match(css,/\.state-list, \.event-list/);assert.match(css,/\.state-item, \.event-item/);assert.match(css,/\.state-metadata-wrap, \.event-metadata-wrap/);});

test("record routes render Core memory while rejecting paths outside approved roots", async (t) => {
 const { child, origin } = await productionServer();
 t.after(() => child.kill());

 const memory = await fetch(`${origin}/records/2.core/memory/core.md`);
 assert.equal(memory.status, 200);
 assert.match(await memory.text(), /Core memory/);

 const repositoryMarkdown = await fetch(`${origin}/records/2.core/system/directory.md`);
 assert.equal(repositoryMarkdown.status, 200);

 const traversal = await fetch(`${origin}/records/2.core/memory/..%2Fsystem%2Fdirectory.md`);
 assert.equal(traversal.status, 404);
 assert.equal((await fetch(`${origin}/records/package.json`)).status, 404);
 assert.equal((await fetch(`${origin}/records/2.core/missing.md`)).status, 404);
 assert.equal((await fetch(`${origin}/records/node_modules/example.md`)).status, 404);
});

test("knowledge graph retains its dark radial canvas", async()=>{const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");const stage=css.match(/\.graph-stage \{[^}]+\}/)?.[0] || "";assert.match(stage,/--graph-canvas: #111416/);assert.match(stage,/radial-gradient/);assert.match(css,/\.cytoscape-graph/);});

test("knowledge graph labels use the legend font stack", async()=>{const graph=await readFile(new URL("../app/knowledge-graph.tsx",import.meta.url),"utf8");const css=await readFile(new URL("../app/globals.css",import.meta.url),"utf8");assert.match(css,/body \{[^}]*font-family: Roboto, "Segoe UI", Arial, sans-serif/);assert.match(graph,/"font-family": 'Roboto, "Segoe UI", Arial, sans-serif'/);});
