import type { ReactNode } from "react";

export type Heading = { type: "heading"; level: number; text: string; id: string };

type Block =
  | Heading
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | List
  | { type: "code"; language: string; text: string }
  | { type: "table"; rows: string[][]; header: string[] }
  | { type: "rule" };

type List = { type: "list"; ordered: boolean; items: ListItem[] };
type ListItem = { text: string; indent: number; children: List[] };

type ListLine = { indent: number; ordered: boolean; text: string };
type StateItem = { description: string; metadata: { label: string; value: string }[] };
type EventItem = { description: string; metadata: { label: string; value: string }[] };

const stateMetadata = /^(Effective|Last confirmed|Source|Transaction):\s*(.+)$/i;
const eventMetadata = /^(Date|Source|Transaction):\s*(.+)$/i;

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "");
}

function cells(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
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

function parseList(lines: string[], start: number, indent: number, ordered: boolean): [List, number] {
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const current = listLine(lines[i]);
    if (!current || current.indent !== indent || current.ordered !== ordered) break;
    const item: ListItem = { text: current.text, indent: current.indent, children: [] };
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

function headingText(text: string) {
  return text.replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*_~]/g, "").trim();
}

export function headingSlug(text: string) {
  return headingText(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
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

export function parseMarkdown(markdown: string): Block[] {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const blocks: Block[] = [];
  const headingIds = new Set<string>();
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      const code: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push({ type: "code", language: fence[1].trim(), text: code.join("\n") }); continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const { text, base } = headingDefinition(heading[2]);
      blocks.push({ type: "heading", level: heading[1].length, text, id: uniqueHeadingId(base, headingIds) }); i++; continue;
    }
    if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) { blocks.push({ type: "rule" }); i++; continue; }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const header = cells(line); const rows: string[][] = []; i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
      blocks.push({ type: "table", header, rows }); continue;
    }
    const list = listLine(line);
    if (list) {
      const [block, next] = parseList(lines, i, list.indent, list.ordered);
      blocks.push(block); i = next; continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: quote.join(" ") }); continue;
    }
    const paragraph = [line.trim()]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s|^```|^>|^\s*(?:(?:\d+)\.|[-*+])\s+/.test(lines[i])) paragraph.push(lines[i++].trim());
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

export function headingOutline(markdown: string): Heading[] {
  return parseMarkdown(markdown).filter((block): block is Heading => block.type === "heading");
}

function inline(text: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_))/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>;
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") || part.startsWith("__")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") || part.startsWith("_")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function stateItem(item: ListItem): StateItem | null {
  const match = item.text.match(/^\[state:[^\]]+\]\s*(.*)$/);
  if (!match || item.children.length !== 1) return null;
  const metadata = item.children[0].items.map((child) => {
    const field = child.text.match(stateMetadata);
    return field && child.children.length === 0 ? { label: field[1], value: field[2] } : null;
  });
  if (metadata.some((field) => field === null)) return null;
  return { description: match[1], metadata: metadata as StateItem["metadata"] };
}

function eventItem(item: ListItem): EventItem | null {
  const match = item.text.match(/^\[event:[^\]]+\]\s*(.*)$/);
  if (!match || item.children.length !== 1) return null;
  const metadata = item.children[0].items.map((child) => {
    const field = child.text.match(eventMetadata);
    return field && child.children.length === 0 ? { label: field[1], value: field[2] } : null;
  });
  if (metadata.some((field) => field === null)) return null;
  return { description: match[1], metadata: metadata as EventItem["metadata"] };
}

export default function MarkdownContent({ markdown }: { markdown: string }) {
  function renderList(list: List, key: number) {
    const states = !list.ordered ? list.items.map(stateItem) : [];
    if (states.length > 0 && states.every(Boolean)) {
      return <div className="state-list" key={key}>{(states as StateItem[]).map((state, stateIndex) =>
        <section className="state-item" key={stateIndex}>
          <p>{inline(state.description)}</p>
          <div className="state-metadata-wrap"><table aria-label="Fact metadata"><tbody>{state.metadata.map((field) =>
            <tr key={field.label}><th scope="row">{field.label}</th><td>{inline(field.value)}</td></tr>
          )}</tbody></table></div>
        </section>
      )}</div>;
    }
    const events = !list.ordered ? list.items.map(eventItem) : [];
    if (events.length > 0 && events.every(Boolean)) {
      return <div className="event-list" key={key}>{(events as EventItem[]).map((event, eventIndex) =>
        <section className="event-item" key={eventIndex}>
          <p>{inline(event.description)}</p>
          <div className="event-metadata-wrap"><table aria-label="Event metadata"><tbody>{event.metadata.map((field) =>
            <tr key={field.label}><th scope="row">{field.label}</th><td>{inline(field.value)}</td></tr>
          )}</tbody></table></div>
        </section>
      )}</div>;
    }
    const ListTag = list.ordered ? "ol" : "ul";
    return <ListTag key={key}>{list.items.map((item, itemIndex) =>
      <li key={itemIndex}>{inline(item.text)}{item.children.map(renderList)}</li>
    )}</ListTag>;
  }

  return <div className="markdown-content">{parseMarkdown(markdown).map((block, index) => {
    if (block.type === "heading") {
      const Heading = `h${block.level}` as keyof React.JSX.IntrinsicElements;
      return <Heading id={block.id} key={index}>{inline(block.text)}<a className="heading-permalink" href={`#${block.id}`} aria-label={`Link to ${headingText(block.text)}`}><span aria-hidden="true">#</span></a></Heading>;
    }
    if (block.type === "paragraph") return <p key={index}>{inline(block.text)}</p>;
    if (block.type === "quote") return <blockquote key={index}>{inline(block.text)}</blockquote>;
    if (block.type === "rule") return <hr key={index} />;
    if (block.type === "code") return <pre key={index} data-language={block.language || undefined}><code>{block.text}</code></pre>;
    if (block.type === "list") {
      return renderList(block, index);
    }
    return <div className="markdown-table-wrap" key={index}><table><thead><tr>{block.header.map((cell, cellIndex) => <th key={cellIndex}>{inline(cell)}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>;
  })}</div>;
}
