import { mkdir, writeFile, rm, readdir } from "node:fs/promises";
await rm("public/demo-brain-data.json", { force: true });
await rm("out", { recursive: true, force: true });
await mkdir("public", { recursive: true });
// Export only the reviewed public asset. Fail closed on accidental extra files.
for (const file of await readdir("public")) {
  if (!["favicon.svg", "brain-data.json"].includes(file)) throw new Error(`Unreviewed public asset: ${file}`);
}
await writeFile("public/brain-data.json", JSON.stringify({ schemaVersion: 5, source: "empty application shell", graph: { nodes: [], edges: [], themes: [] }, markdown: { files: [] } }));
