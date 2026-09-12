import type { ReactNode } from "react";
import {
  headingText,
  parseMarkdown,
  type List,
  type ListItem,
} from "../../markdown-parser";

export {
  headingDefinition,
  headingOutline,
  headingSlug,
  parseMarkdown,
  uniqueHeadingId,
  type Heading,
} from "../../markdown-parser";

type ResolveLink = (href: string) => string | undefined;
type MetadataItem = {
  description: string;
  metadata: { label: string; value: string }[];
};
type TaskItem = { checked: boolean; text: string };
type MetadataKind = "state" | "event";

const metadataFormats = {
  state: {
    marker: /^\[state:[^\]]+\]\s*(.*)$/,
    field: /^(Effective|Last confirmed|Source|Transaction):\s*(.+)$/i,
    label: "Fact metadata",
  },
  event: {
    marker: /^\[event:[^\]]+\]\s*(.*)$/,
    field: /^(Date|Source|Transaction):\s*(.+)$/i,
    label: "Event metadata",
  },
};

function renderInline(text: string, resolveLink: ResolveLink): ReactNode[] {
  const pattern =
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_))/g;
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part, index) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link)
        return (
          <a key={index} href={resolveLink(link[2])} rel="noreferrer">
            {link[1]}
          </a>
        );
      if (part.startsWith("`"))
        return <code key={index}>{part.slice(1, -1)}</code>;
      if (part.startsWith("**") || part.startsWith("__"))
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") || part.startsWith("_"))
        return <em key={index}>{part.slice(1, -1)}</em>;
      return part;
    });
}

function metadataItem(item: ListItem, kind: MetadataKind): MetadataItem | null {
  const format = metadataFormats[kind];
  const match = item.text.match(format.marker);
  if (!match || item.children.length !== 1) return null;
  const metadata = item.children[0].items.map((child) => {
    const field = child.text.match(format.field);
    return field && child.children.length === 0
      ? { label: field[1], value: field[2] }
      : null;
  });
  if (metadata.some((field) => field === null)) return null;
  return {
    description: match[1],
    metadata: metadata as MetadataItem["metadata"],
  };
}

function taskItem(item: ListItem): TaskItem | null {
  const match = item.text.match(/^\[([ xX])\]\s+(.+)$/);
  return match
    ? { checked: match[1].toLowerCase() === "x", text: match[2] }
    : null;
}

export default function MarkdownContent({
  markdown,
  resolveLink = (href) =>
    /^(https?:\/\/|mailto:|#)/i.test(href) ? href : undefined,
}: {
  markdown: string;
  resolveLink?: ResolveLink;
}) {
  const inline = (text: string) => renderInline(text, resolveLink);

  function renderMetadataList(list: List, kind: MetadataKind, key: number) {
    const items = !list.ordered
      ? list.items.map((item) => metadataItem(item, kind))
      : [];
    if (
      !items.length ||
      !items.every((item): item is MetadataItem => item !== null)
    )
      return null;

    return (
      <div className={`${kind}-list`} key={key}>
        {items.map((item, itemIndex) => (
          <section className={`${kind}-item`} key={itemIndex}>
            <p>{inline(item.description)}</p>
            <div className={`${kind}-metadata-wrap`}>
              <table aria-label={metadataFormats[kind].label}>
                <tbody>
                  {item.metadata.map((field) => (
                    <tr key={field.label}>
                      <th scope="row">{field.label}</th>
                      <td>{inline(field.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    );
  }

  function renderList(list: List, key: number) {
    const metadataList =
      renderMetadataList(list, "state", key) ??
      renderMetadataList(list, "event", key);
    if (metadataList) return metadataList;

    const ListTag = list.ordered ? "ol" : "ul";
    return (
      <ListTag key={key}>
        {list.items.map((item, itemIndex) => {
          const task = taskItem(item);
          return (
            <li className={task ? "task-list-item" : undefined} key={itemIndex}>
              {task ? (
                <label className="task-list-label">
                  <input type="checkbox" checked={task.checked} disabled />
                  <span>{inline(task.text)}</span>
                </label>
              ) : (
                inline(item.text)
              )}
              {item.children.map(renderList)}
            </li>
          );
        })}
      </ListTag>
    );
  }

  return (
    <div className="markdown-content">
      {parseMarkdown(markdown).map((block, index) => {
        if (block.type === "heading") {
          const Heading =
            `h${block.level}` as keyof React.JSX.IntrinsicElements;
          return (
            <Heading id={block.id} key={index}>
              {inline(block.text)}
              <a
                className="heading-permalink"
                href={`#${block.id}`}
                aria-label={`Link to ${headingText(block.text)}`}
              >
                <span aria-hidden="true">#</span>
              </a>
            </Heading>
          );
        }
        if (block.type === "paragraph")
          return <p key={index}>{inline(block.text)}</p>;
        if (block.type === "quote")
          return <blockquote key={index}>{inline(block.text)}</blockquote>;
        if (block.type === "rule") return <hr key={index} />;
        if (block.type === "code") {
          return (
            <pre key={index} data-language={block.language || undefined}>
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === "list") return renderList(block, index);

        return (
          <div className="markdown-table-wrap" key={index}>
            <table>
              <thead>
                <tr>
                  {block.header.map((cell, cellIndex) => (
                    <th key={cellIndex}>{inline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{inline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
