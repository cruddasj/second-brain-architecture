# Browser explorer

A provider-neutral, optional Next.js explorer for reading committed Markdown and visualising Core records. Cytoscape.js supplies the knowledge graph while the shared application menu also provides a repository-wide Markdown reader. The interface reads generated JSON and repository files and never writes to them.

## Prerequisites

Install these before running the website locally:

- **Node.js 22.13.0 or later**: required by the application. Installing Node.js normally also installs npm.
- **npm**: used to install dependencies and run the supplied commands.
- **Git**: required by the normal data builder to discover the Markdown files committed to the second-brain repository.
- **A modern web browser**: for example Chrome, Edge, Firefox or Safari.

Python 3 is also required if you run `npm run brain:check`, because that validation command runs the Core repository checker. It is not required simply to start the demo website.

You can confirm the main command-line prerequisites with:

```bash
node --version
npm --version
git --version
```

Run all npm commands below from the `3.add-ons/browser-explorer/` directory.

## Local use

The `/connection` page shares the explorer's navigation, full-width reader card and styling. Development mode clearly identifies the local checkout as the source and skips connection setup. Restart development to rebuild the snapshot after editing Markdown.

```bash
npm ci
npm run brain:check
npm run dev
```

The data builder writes schema version 5 of `public/brain-data.json`. Its `graph` property retains the curated Core-only graph semantics; its `markdown.files` index lists every committed repository `.md` file with a title, filename, normalized repository-relative path, and folder segments. Generated, dependency, and VCS directories are excluded. Graph connections represent only explicit Markdown links and collection membership. Theme membership is exposed only when a record and a Core theme contain reciprocal Markdown links, so the visualisation does not infer or invent relationships.

## Installable app and connection testing

From this same directory, stop development and run:

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/connection`. Production preview enables connection setup even on localhost; only development mode bypasses it. The preview is a static-file server, not a sync API. The build exports this application to `out/`, without local or demo repository data. Do not serve the repository root or development `public/` folder.

An optional adapter, selected by Plugin UUID `befe7498-69c4-4f09-913d-9b36830a9882` through the plugin registry, supplies retrieval and provider-specific setup guidance. It is not a separate application. Without it, local browsing still works. No credential is built into the app.

Connect and sync downloads Markdown from one default-branch commit. Both views use that snapshot; refresh replaces it atomically, reuses unchanged files and removes deleted files. Failed refreshes preserve the previous copy. Settings are saved in browser storage; saving the token is opt-in. Disconnect removes the connection, token and downloaded Markdown. Storage is namespaced by the application path within the browser origin. Different hostnames, ports and browsers do not share it; paths on the same origin are not a security boundary. It is not encrypted by this app and can be cleared by the browser or device.

Setup includes **Install app**, with browser-menu guidance when a prompt is unavailable. Windows and Android browsers can offer installation. On an iPhone or iPad, open the page in Safari, tap the Share button, then choose Add to Home Screen. Installation and offline shell caching are production-only. After the shell caches and content syncs, both views work offline, including reloads. Icons are bundled locally. A first visit needs network access.

On mobile, localhost means the phone, not your computer. Mobile installation needs this static output served from an HTTPS address accessible to the device. The local build does not publish anything. For a URL subdirectory, set `NEXT_PUBLIC_BASE_PATH=/example` for build and preview. Routes, icons, installation scope and offline caches then use that path. Keep the value consistent between commands.

Record links now use `/record/?file=<encoded repository path>#heading`, so new files do not require rebuilding the application. Old server-rendered `/records/...` bookmarks are replaced by these links. Executable links are inert, raw HTML is not executed, and attachments/images remain outside V1.

Run `npm test` for the build and reader regression suite. Adapter-specific browser tests live with the optional adapter.

## Screenshots

The web browser add-on allows you to visualise the contents of your second brain using a knowledge graph, powered by Cytoscape.js.

![Knowledge graph unfiltered](../../assets/images/knowledge-graph.png)

Using the application, you can filter the graph using specific collections of interest, or apply universal searches for matching topics.

![Knowledge graph filtered](../../assets/images/knowledge-graph-collection-filtered.png)

You can also explore the contents of the second brain using a Markdown file viewer, optimised for the structure of records held in the second brain.

![Markdown reader](../../assets/images/markdown-reader.png)

## Demo mode

A new installation can run the explorer without adding any real knowledge:

```bash
npm ci
npm start
```

`npm start` launches the same demo workspace as `npm run demo`, on the normal development address. Both commands generate `public/demo-brain-data.json` and configure the explorer to use a synthetic graph instead of the normal Core-derived graph. The demo graph is deterministic and contains exactly 100 synthetic nodes across example collections and seven themes, including cross-theme records and enough relationships to demonstrate filtering, selection, neighbourhood exploration, automatic layout, dragging, zooming and theme colouring.

Demo mode changes only the graph data. The application remains read-only, so the normal repository Markdown index is retained and the Markdown reader can still browse Core and the rest of the committed repository. Synthetic graph records deliberately have no repository file paths, so selecting a synthetic node does not pretend that a matching real record exists.

Running `npm run demo` also rebuilds the normal read-only Markdown index before creating the demo data. Neither generated JSON file is committed to Git. Running `npm run dev` afterwards returns the graph to the repository's actual Core content. `npm run demo:build` can be used when only the synthetic graph data and repository Markdown index need to be regenerated without starting the application.

The architectural `2.core/memory/core.md` record is intentionally omitted from the normal graph. Selecting any other normal node lists its own and its directly connected Markdown files in the detail panel. The Markdown reader offers a searchable folder tree for the complete index. Files open as read-only, app-styled pages while the shared menu remains available.

When a graph has no saved positions, Cytoscape automatically arranges the visible nodes with extra room for record labels and fits them in the viewport. Node coordinates stay in that browser's local storage, so returning to the graph restores the saved arrangement instead of running the automatic layout again. Drag nodes to place them manually; nodes remain keyboard-selectable and focused nodes can also be moved with the arrow keys (or Shift + arrow for a larger step). Both forms of manual movement save the new coordinate.

Dragging gently pulls linked nodes through damped springs. Nearby nodes repel one another to make space, while a weak anchor limits drift from the existing arrangement. The dragged node stays under the pointer; surrounding nodes settle for at most 1.5 seconds after release, and all resulting positions are saved locally. Hidden nodes do not participate. Changing filters, arranging the graph or leaving the page stops the simulation. Reduced-motion preferences disable these secondary movements, and keyboard movement remains direct.

**Arrange graph** runs the automatic layout over the currently visible nodes, fits them in the viewport, and saves the result; choosing it may replace coordinates created by manual dragging for those nodes. **Reset layout** first clears every saved coordinate, then automatically arranges and fits the visible nodes and saves the resulting stable positions. Filtering before either action limits the arrangement and fit to visible nodes. Scroll a mouse wheel or use a trackpad over the canvas to zoom around the pointer.

Provider-specific authentication and retrieval belong to optional adapters under `1.plugins/`; this application consumes their portable interface. Standard browser installation and static shell caching are owned by the add-on.
