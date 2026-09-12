import assert from "node:assert/strict";
import test from "node:test";
import { buildBrainData, markdownFileEntry } from "../offline/snapshot.mjs";

test("Markdown index titles retain metadata, heading and filename precedence", () => {
  const cases = [
    { content: "---\ntitle: 'Metadata title'\n---\n# Heading", title: "Metadata title" },
    { content: "---\r\ntitle: false\r\n---\r\n# Heading fallback  \r\n", title: "Heading fallback" },
    { content: "---\ntitle: null\n---\nNo heading", title: "a note" },
    { content: "---\ntitle: true\n---\n# Heading", title: "true" },
    { content: "---\ntitle: [First, Second]\n---\n# Heading", title: "First,Second" },
    { content: "---\ntitle: ''\n---\n# First heading\n# Later heading", title: "First heading" },
    { content: "## A subsection only", title: "a note" },
  ];
  for (const { content, title } of cases) {
    assert.deepEqual(markdownFileEntry({ path: "folder/subfolder/a note.md", content }), {
      path: "folder/subfolder/a note.md",
      title,
      filename: "a note.md",
      folders: ["folder", "subfolder"],
    });
  }
});

test("snapshot Markdown index sorts paths, omits content, and preserves its inputs", () => {
  const entries = [
    { path: "z-folder/last.md", content: "# Last" },
    { path: "README.md", content: "# First" },
    { path: "a-folder/middle.md", content: "# Middle" },
  ];
  const original = structuredClone(entries);
  const files = buildBrainData(entries).markdown.files;
  assert.deepEqual(files, [
    { path: "a-folder/middle.md", title: "Middle", filename: "middle.md", folders: ["a-folder"] },
    { path: "README.md", title: "First", filename: "README.md", folders: [] },
    { path: "z-folder/last.md", title: "Last", filename: "last.md", folders: ["z-folder"] },
  ]);
  assert.deepEqual(entries, original);
});
