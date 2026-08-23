import type { Metadata } from "next";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import MarkdownContent, { headingOutline } from "./markdown-content";
import TableOfContents from "./table-of-contents";
import ApplicationShell from "../../application-shell";
import type { BrainData } from "../../brain-data";

const repositoryRoot = path.resolve(process.cwd(), "../..");
const excludedDirectories = new Set([".git", ".next", "node_modules"]);

type RecordPageProps = { params: Promise<{ path: string[] }> };

async function loadRecord(segments: string[]) {
  const relativePath = segments.join("/");
  if (!relativePath.endsWith(".md") || path.isAbsolute(relativePath) || segments.some((segment) => !segment || segment === "." || segment === ".." || excludedDirectories.has(segment))) notFound();
  const filePath = path.resolve(repositoryRoot, relativePath);
  if (!filePath.startsWith(`${repositoryRoot}${path.sep}`)) notFound();
  try {
    const data = JSON.parse(await readFile(path.join(process.cwd(), "public/brain-data.json"), "utf8")) as BrainData;
    if (!data.markdown.files.some((file) => file.path === relativePath)) notFound();
    const realPath = await realpath(filePath);
    if (!realPath.startsWith(`${repositoryRoot}${path.sep}`)) notFound();
    return { markdown: await readFile(realPath, "utf8"), relativePath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw error;
  }
}

function recordTitle(markdown: string) {
  const frontmatterTitle = markdown.match(/^---\s*[\s\S]*?^title:\s*(.+?)\s*$[\s\S]*?^---\s*$/m)?.[1];
  return frontmatterTitle || markdown.match(/^#\s+(.+)$/m)?.[1] || "Knowledge record";
}

export async function generateMetadata({ params }: RecordPageProps): Promise<Metadata> {
  const { markdown } = await loadRecord((await params).path);
  const title = recordTitle(markdown);
  return { title: `${title} · Second Brain Explorer` };
}

export default async function RecordPage({ params }: RecordPageProps) {
  const { markdown, relativePath } = await loadRecord((await params).path);
  const headings = headingOutline(markdown);
  const sections = headings.filter((heading) => heading.level > 1);
  return <ApplicationShell><main className="record-shell">
    <div className="record-layout">
    <article className="markdown-card" id="record-content">
      <div className="record-context"><span className="record-path">{relativePath}</span></div>
      <MarkdownContent markdown={markdown} />
    </article>
    {sections.length > 1 && <TableOfContents headings={sections} />}
    </div>
  </main></ApplicationShell>;
}
