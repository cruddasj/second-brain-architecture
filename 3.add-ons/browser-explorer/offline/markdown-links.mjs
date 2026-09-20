import { parseDocument } from "yaml";

export function metadata(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  try {
    const document = parseDocument(match[1], { uniqueKeys: true, merge: false });
    if (document.errors.length) return {};
    const value = document.toJS({ maxAliasCount: 0 });
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function visibleText(content) {
  let front = /^---\r?\n/.test(content), fence = null, comment = false;
  return content.split(/\r?\n/).map((line, index) => {
    if (front) { if (index && line.trim() === "---") front = false; return ""; }
    if (line.includes("<!--")) comment = true;
    if (comment) { if (line.includes("-->")) comment = false; return ""; }
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !line.trim().slice(marker[1].length).trim()) fence = null;
      return "";
    }
    return fence || /^( {4}|\t)/.test(line) ? "" : line;
  }).join("\n");
}

export function parseWikilink(token) {
  const match = token.match(/^\[\[([^\]\n]+)\]\]$/);
  if (!match) return null;
  const [target, ...label] = match[1].split("|");
  return { target: target.trim(), label: label.length ? label.join("|").trim() : target.trim() };
}

export function markdownLinks(content) {
  let text = visibleText(content).replace(/(`+)[\s\S]*?\1/g, "");
  const wiki = [...text.matchAll(/(?<![!\\])\[\[[^\]\n]+\]\]/g)].map(m => m[0]);
  text = text.replace(/!?\[\[[^\]\n]+\]\]/g, "");
  const result = [...text.matchAll(/(?<!!)\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g)].map(m => m[1].replace(/^<|>$/g, ""));
  const definitions = new Map([...text.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(<[^>]+>|\S+)/gm)].map(m => [m[1].trim().toLowerCase(), m[2].replace(/^<|>$/g, "")]));
  for (const m of text.matchAll(/(?<!!)\[([^\]\n]+)\](?:\[([^\]\n]*)\])?(?![:(])/g)) {
    const href = definitions.get((m[2] || m[1]).trim().toLowerCase());
    if (href) result.push(href);
  }
  return [...new Set([...result, ...wiki])];
}

function headingSlug(text) {
  return text.replace(/<[^>]+>/g, "").replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/[`*_~]/g, "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
}

function wikiHeadings(content) {
  const used = new Set(), found = [];
  for (const match of visibleText(content).matchAll(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/gm)) {
    const explicit = match[2].match(/\s+\{#([A-Za-z][\w:.-]*)\}\s*$/);
    const title = explicit ? match[2].slice(0, explicit.index).trim() : match[2];
    const base = explicit?.[1] || headingSlug(title);
    let anchor = base, suffix = 2;
    while (used.has(anchor)) anchor = `${base}-${suffix++}`;
    used.add(anchor); found.push({ title, anchor });
  }
  return found;
}

function normalize(path) {
  const parts = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") { if (!parts.length) return null; parts.pop(); }
    else parts.push(part);
  }
  return parts.join("/");
}

export function createWikilinkIndex(entries) {
  entries = entries.filter(entry => entry.path.endsWith('.md') && !entry.path.startsWith('2.core/sources/raw/'));
  const records = new Map(entries.map(entry => [entry.path, entry.content]));
  const names = new Map();
  for (const { path, content } of entries) {
    const meta = metadata(content);
    const candidates = [path.split("/").pop().replace(/\.md$/, ""), meta.title || content.match(/^#\s+(.+)$/m)?.[1], ...(Array.isArray(meta.aliases) ? meta.aliases : [])];
    for (const name of candidates) {
      if (typeof name !== "string" || !name.trim()) continue;
      const key = name.trim().normalize("NFC").toLowerCase();
      if (!names.has(key)) names.set(key, new Set());
      names.get(key).add(path);
    }
  }
  return (current, token) => {
    const wiki = parseWikilink(token);
    if (!wiki) return null;
    let value;
    try { value = decodeURIComponent(wiki.target); } catch { return null; }
    const hash = value.indexOf("#");
    const name = (hash < 0 ? value : value.slice(0, hash)).trim();
    let heading = hash < 0 ? "" : value.slice(hash + 1);
    if (/[\u0000-\u001f\\?:]/.test(name) || name.startsWith("//")) return null;
    let candidates;
    if (!name) candidates = new Set(heading && records.has(current) ? [current] : []);
    else if (name.includes("/")) {
      const filename = name.endsWith(".md") ? name : name + ".md";
      const paths = [normalize(filename)];
      if (!name.startsWith("/")) paths.push(normalize(current.split("/").slice(0, -1).join("/") + "/" + filename));
      candidates = new Set(paths.filter(path => path && records.has(path)));
    } else candidates = names.get(name.replace(/\.md$/, "").normalize("NFC").toLowerCase()) || new Set();
    if (candidates.size !== 1) return null;
    const path = [...candidates][0];
    if (heading) {
      const content = records.get(path), headings = wikiHeadings(content);
      const anchors = new Set([...headings.map(h => h.anchor), ...[...visibleText(content).matchAll(/<a\s+(?:id|name)=["']([^"']+)["']/gi)].map(m => m[1])]);
      if (!anchors.has(heading)) {
        const found = headings.filter(h => h.title.trim().toLowerCase() === heading.trim().toLowerCase());
        if (found.length !== 1) return null;
        heading = found[0].anchor;
      }
    }
    return { path, heading };
  };
}
