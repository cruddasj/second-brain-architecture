import { buildGraph, parseMarkdown } from "../offline/snapshot.mjs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const addonRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(addonRoot, "../..");
const execFileAsync = promisify(execFile);
const excludedDirectories = new Set([".git", ".next", "node_modules"]);

async function committedMarkdownFiles() {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--", "*.md"], { cwd: repositoryRoot, encoding: "buffer", maxBuffer: 10 * 1024 * 1024 });
  return stdout.toString("utf8").split("\0").filter(Boolean)
    .map((value) => value.replaceAll("\\", "/"))
    .filter((value) => value.endsWith(".md") && !value.split("/").some((part) => excludedDirectories.has(part)))
    .filter((value) => { const resolved = path.resolve(repositoryRoot, value); return resolved.startsWith(`${repositoryRoot}${path.sep}`); })
    .sort((a, b) => a.localeCompare(b));
}

async function markdownFiles(directory) {
  const results = [];
  let entries = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return results;
    throw error;
  }
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await markdownFiles(fullPath)));
    if (entry.isFile() && entry.name.endsWith(".md")) results.push(fullPath);
  }
  return results.sort();
}

async function loadGraph() {
  const files = (await Promise.all(["memory", "knowledge", "sources/notes", "themes"].map((root) => markdownFiles(path.join(repositoryRoot, "2.core", root))))).flat();
  return buildGraph(await Promise.all(files.map(async (file) => ({ path: path.relative(repositoryRoot, file).split(path.sep).join("/"), content: await fs.readFile(file, "utf8") }))));
}

async function loadMarkdownIndex() {
  const files = [];
  for (const relativePath of await committedMarkdownFiles()) {
    const candidate = path.join(repositoryRoot, relativePath);
    const realPath = await fs.realpath(candidate);
    if (!realPath.startsWith(`${repositoryRoot}${path.sep}`)) continue;
    const content = await fs.readFile(realPath, "utf8");
    const parsed = parseMarkdown(content);
    const filename = path.posix.basename(relativePath);
    const title = String(parsed.metadata.title || parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim() || filename.replace(/\.md$/, ""));
    files.push({ path: relativePath, title, filename, folders: relativePath.split("/").slice(0, -1), content });
  }
  return { files };
}

const output = {
  schemaVersion: 5,
  source: "committed repository Markdown plus Core-only graph records (read-only; no dashboard flag required)",
  graph: await loadGraph(),
  markdown: await loadMarkdownIndex(),
};
output.snapshot = { version: 1, repositoryId: 0, repository: "Local checkout", branch: "local", commit: "", checkedAt: new Date().toISOString(), downloadedAt: new Date().toISOString(), files: output.markdown.files.map(({ path, content }) => ({ path, content, sha: "" })) };
output.markdown.files = output.markdown.files.map(({ content, ...file }) => file);

await fs.mkdir(path.join(addonRoot, "public"), { recursive: true });
await fs.writeFile(path.join(addonRoot, "public", "brain-data.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Built explorer data for ${output.graph.nodes.length} graph node(s), ${output.graph.themes.length} theme(s), and ${output.markdown.files.length} Markdown file(s).`);
