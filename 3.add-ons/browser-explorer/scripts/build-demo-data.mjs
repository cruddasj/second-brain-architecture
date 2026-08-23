import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createDemoData } from "./demo-data.mjs";

const addonRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);
const normalDataPath = path.join(addonRoot, "public", "brain-data.json");
const outputPath = path.join(addonRoot, "public", "demo-brain-data.json");

await execFileAsync(process.execPath, [path.join(addonRoot, "scripts", "build-brain-data.mjs")], { cwd: addonRoot });
const normalData = JSON.parse(await fs.readFile(normalDataPath, "utf8"));
const output = createDemoData(normalData.markdown);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Built synthetic demo graph with ${output.graph.nodes.length} nodes and ${output.graph.edges.length} edges; indexed ${output.markdown.files.length} repository Markdown file(s) for read-only browsing.`);
