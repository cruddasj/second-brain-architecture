export type Heading = {
  type: "heading";
  level: number;
  text: string;
  id: string;
};

export type Block =
  | Heading
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | List
  | { type: "code"; language: string; text: string }
  | { type: "table"; rows: string[][]; header: string[] }
  | { type: "rule" };

export type List = { type: "list"; ordered: boolean; items: ListItem[] };
export type ListItem = { text: string; indent: number; children: List[] };

type ListLine = { indent: number; ordered: boolean; text: string };

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "");
}

function stripHtmlComments(markdown: string) {
  let hidden = false;
  let fenced = false;
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (!hidden && /^\s*```/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;

      let visible = "";
      let remainder = line;
      while (remainder) {
        if (hidden) {
          const end = remainder.indexOf("-->");
          if (end < 0) return visible;
          hidden = false;
          remainder = remainder.slice(end + 3);
        } else {
          const start = remainder.indexOf("<!--");
          if (start < 0) return visible + remainder;
          visible += remainder.slice(0, start);
          hidden = true;
          remainder = remainder.slice(start + 4);
        }
      }
      return visible;
    })
    .join("\n");
}

function cells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function listLine(line: string): ListLine | null {
  const match = line.match(/^([ \t]*)(?:(\d+)\.|[-*+])\s+(.+)$/);
  if (!match) return null;
  return {
    indent: match[1].replace(/\t/g, "    ").length,
    ordered: Boolean(match[2]),
    text: match[3],
  };
}

function parseList(
  lines: string[],
  start: number,
  indent: number,
  ordered: boolean,
): [List, number] {
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const current = listLine(lines[i]);
    if (!current || current.indent !== indent || current.ordered !== ordered)
      break;
    const item: ListItem = {
      text: current.text,
      indent: current.indent,
      children: [],
    };
    i++;
    while (i < lines.length) {
      const child = listLine(lines[i]);
      if (!child || child.indent <= indent) break;
      const [children, next] = parseList(lines, i, child.indent, child.ordered);
      item.children.push(children);
      i = next;
    }
    items.push(item);
  }
  return [{ type: "list", ordered, items }, i];
}

export function headingText(text: string) {
  return text
    .replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

export function headingSlug(text: string) {
  return (
    headingText(text)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

export function headingDefinition(source: string) {
  const explicit = source.match(/\s+\{#([A-Za-z][\w:.-]*)\}\s*$/);
  const text = explicit ? source.slice(0, explicit.index).trim() : source;
  return { text, base: explicit?.[1] || headingSlug(text) };
}

export function uniqueHeadingId(base: string, used: Set<string>) {
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  return id;
}

// This is the reader's limited display syntax; snapshot extraction has its own parser.
export function parseMarkdown(markdown: string): Block[] {
  const lines = stripHtmlComments(stripFrontmatter(markdown)).split(/\r?\n/);
  const blocks: Block[] = [];
  const headingIds = new Set<string>();

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = line.match(/^```(.*)$/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```"))
        code.push(lines[i++]);
      i++;
      blocks.push({
        type: "code",
        language: fence[1].trim(),
        text: code.join("\n"),
      });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const { text, base } = headingDefinition(heading[2]);
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text,
        id: uniqueHeadingId(base, headingIds),
      });
      i++;
      continue;
    }

    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-+/.test(lines[i + 1])
    ) {
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim())
        rows.push(cells(lines[i++]));
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const list = listLine(line);
    if (list) {
      const [block, next] = parseList(lines, i, list.indent, list.ordered);
      blocks.push(block);
      i = next;
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">"))
        quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const paragraph = [line.trim()];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s|^```|^>|^\s*(?:(?:\d+)\.|[-*+])\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i++].trim());
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

export function headingOutline(markdown: string): Heading[] {
  return parseMarkdown(markdown).filter(
    (block): block is Heading => block.type === "heading",
  );
}
