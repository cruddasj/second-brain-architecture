# On-device reader components

Provider-neutral snapshot parsing, local storage and record navigation for the existing explorer. Follow the [Add-on contract](../../CONTRACT.md) and [Core contract](../../../2.core/CONTRACT.md).

`snapshot.mjs` owns graph interpretation shared with the existing local builder. It takes repository-relative Markdown entries with `path` and `content` and exposes `buildGraph` and `buildBrainData`; collection edges, explicit links, reciprocal themes and the Core-memory exclusion retain the local explorer's semantics. `snapshot.worker.ts` is an optional worker entry point; the current reader builds the index on the interface thread.

`app/brain-provider.tsx` owns the shared snapshot and derived `BrainData` consumed by the graph, library and record pages. It saves the new snapshot and connection together using `saveState` only after retrieval and indexing succeed. Failed refreshes retain the last valid snapshot. `links.mjs` keeps record paths and heading anchors within the reader and rejects executable URLs. Attachments and images are outside V1.

The optional adapter associated with Plugin UUID `befe7498-69c4-4f09-913d-9b36830a9882` implements the declared `repository-adapter` interface. Build configuration resolves it through the registry, with a local-only fallback if it is absent. Device storage is an offline copy, not canonical state or permission to modify repository knowledge.
