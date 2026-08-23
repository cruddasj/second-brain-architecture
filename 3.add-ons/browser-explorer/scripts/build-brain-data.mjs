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

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^\[.*\]$/.test(trimmed)) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseMarkdown(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const metadata = {};
  let body = content;
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator === -1) continue;
      metadata[line.slice(0, separator).trim()] = parseValue(line.slice(separator + 1));
    }
    body = content.slice(match[0].length);
  }
  return { metadata, body };
}

function section(body, title) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = body.match(new RegExp(`^## ${escaped}\\s*$`, "m"));
  if (!heading || heading.index === undefined) return "";
  const remaining = body.slice(heading.index + heading[0].length).replace(/^\r?\n/, "");
  const nextHeading = remaining.search(/^##\s+/m);
  return (nextHeading === -1 ? remaining : remaining.slice(0, nextHeading)).trim();
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

const recordRoots = ["memory", "knowledge", "sources/notes", "themes"];

function recordKind(relativePath, metadata) {
  if (metadata.type) return String(metadata.type);
  if (relativePath.startsWith("2.core/memory/")) return "memory";
  if (relativePath.startsWith("2.core/themes/")) return "theme";
  if (relativePath.startsWith("2.core/sources/notes/")) return "source note";
  return "record";
}

function recordCollection(relativePath) {
  const parts = relativePath.replace(/^2\.core\//, "").split("/");
  if (parts[0] === "knowledge") return parts.length > 2 ? parts[1].replaceAll("-", " ") : "knowledge";
  if (parts[0] === "sources") return "source notes";
  return parts[0];
}

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^---[\s\S]*?---/m, " ")
    .replace(/!??\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^[#>*-]+\s*/gm, "")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function currentStatePreview(body) {
  const currentState = section(body, "Current state");
  const firstRecord = currentState.match(/^[-*+]\s+(.+)((?:\r?\n[ \t]+[-*+]\s+.+)*)/m);
  if (!firstRecord) return { excerpt: plainText(currentState || body), details: {} };

  const details = {};
  for (const line of firstRecord[2].split(/\r?\n/)) {
    const field = line.match(/^\s+[-*+]\s+(Effective|Last confirmed|Source):\s*(.+)\s*$/i);
    if (!field) continue;
    const key = field[1].toLowerCase() === "effective" ? "effectiveDate"
      : field[1].toLowerCase() === "last confirmed" ? "lastConfirmedDate"
        : "source";
    details[key] = plainText(field[2]);
  }

  return {
    excerpt: plainText(firstRecord[1].replace(/^\[state:[^\]]+\]\s*/, "")),
    details,
  };
}

async function loadGraph() {
  const discoveredFiles = (await Promise.all(recordRoots.map((root) => markdownFiles(path.join(repositoryRoot, "2.core", root))))
    .then((groups) => groups.flat()));
  const collectionIndexPaths = new Map(discoveredFiles
    .filter((file) => path.basename(file) === "index.md")
    .map((file) => {
      const relativePath = path.relative(repositoryRoot, file).split(path.sep).join("/");
      return [recordCollection(relativePath), relativePath];
    }));
  const files = discoveredFiles
    .filter((file) => path.basename(file) !== "index.md")
    .filter((file) => path.relative(repositoryRoot, file).split(path.sep).join("/") !== "2.core/memory/core.md");
  const records = [];
  const byPath = new Map();

  for (const file of files) {
    const relativePath = path.relative(repositoryRoot, file).split(path.sep).join("/");
    const content = await fs.readFile(file, "utf8");
    const parsed = parseMarkdown(content);
    const title = parsed.metadata.title || parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(file, ".md");
    const id = relativePath.replace(/\.md$/, "");
    const headings = [...parsed.body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
    const stateCount = (parsed.body.match(/\[state:[^\]]+\]/g) || []).length;
    const eventCount = (parsed.body.match(/\[event:[^\]]+\]/g) || []).length;
    const links = [...content.matchAll(/\[[^\]]+\]\(([^)#?]+\.md)(?:#[^)]*)?\)/g)].map((match) => match[1]);
    const preview = currentStatePreview(parsed.body);
    const record = {
      id,
      title,
      kind: recordKind(relativePath, parsed.metadata),
      collection: recordCollection(relativePath),
      path: relativePath,
      excerpt: preview.excerpt.slice(0, 240),
      details: preview.details,
      headings,
      stateCount,
      eventCount,
      links,
      file,
    };
    records.push(record);
    byPath.set(path.normalize(file), record);
  }

  const resolvedLinks = new Map(records.map((record) => [record.id, new Set()]));
  for (const record of records) {
    for (const link of record.links) {
      const target = byPath.get(path.normalize(path.resolve(path.dirname(record.file), link)));
      if (target && target.id !== record.id) resolvedLinks.get(record.id).add(target.id);
    }
  }
  const themes = records.filter((record) => record.kind === "theme");
  const themeMembership = new Map(records.map((record) => [record.id, []]));
  for (const record of records) {
    if (record.kind === "theme") continue;
    for (const theme of themes) {
      if (resolvedLinks.get(record.id).has(theme.id) && resolvedLinks.get(theme.id).has(record.id)) {
        themeMembership.get(record.id).push(theme.id);
      }
    }
  }

  const collections = [...new Set(records.map((record) => record.collection))].sort();
  const nodes = [
    ...collections.map((collection) => ({
      id: `collection:${collection}`,
      title: collection.replace(/\b\w/g, (letter) => letter.toUpperCase()),
      kind: "collection",
      collection,
      path: collectionIndexPaths.get(collection) || "",
      excerpt: `Collection containing ${records.filter((record) => record.collection === collection).length} records.`,
      details: {}, headings: [], stateCount: 0, eventCount: 0, themeIds: [],
    })),
    ...records.map((record) => ({
      id: record.id, title: record.title, kind: record.kind, collection: record.collection,
      path: record.path, excerpt: record.excerpt, details: record.details, headings: record.headings,
      stateCount: record.stateCount, eventCount: record.eventCount, themeIds: themeMembership.get(record.id),
    })),
  ];
  const edges = records.map((record) => ({ source: `collection:${record.collection}`, target: record.id, kind: "collection" }));
  for (const record of records) {
    for (const link of record.links) {
      const target = byPath.get(path.normalize(path.resolve(path.dirname(record.file), link)));
      if (target && target.id !== record.id) edges.push({ source: record.id, target: target.id, kind: "reference" });
    }
  }
  return { nodes, edges, themes: themes.map(({ id, title }) => ({ id, title })) };
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
    files.push({ path: relativePath, title, filename, folders: relativePath.split("/").slice(0, -1) });
  }
  return { files };
}

const output = {
  schemaVersion: 5,
  source: "committed repository Markdown plus Core-only graph records (read-only; no dashboard flag required)",
  graph: await loadGraph(),
  markdown: await loadMarkdownIndex(),
};

await fs.mkdir(path.join(addonRoot, "public"), { recursive: true });
await fs.writeFile(path.join(addonRoot, "public", "brain-data.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Built explorer data for ${output.graph.nodes.length} graph node(s), ${output.graph.themes.length} theme(s), and ${output.markdown.files.length} Markdown file(s).`);
