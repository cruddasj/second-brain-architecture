# Browser explorer

A provider-neutral, optional Next.js explorer for reading committed Markdown and visualising Core records. Cytoscape.js supplies the knowledge graph while the shared application menu also provides a repository-wide Markdown reader. The interface reads generated JSON and repository files and never writes to them.

## Use the hosted app

[Open the hosted Second Brain Explorer (external site)](https://cruddasj.github.io/second-brain-architecture/)
to use the explorer without running a local server. This public app address is an
optional entry point; the explorer remains independently usable locally.

The hosted app starts without your notes. On **Connection**, choose the repository
you want to browse and follow the read-only access instructions. Your browser
downloads and reads the selected Markdown directly from your repository service
to display it. Notes and access tokens are not sent to a separate application
server or added to the public hosted site. Downloaded notes stay in that browser;
remembering the access token on the device is optional.

The app does not encrypt its browser storage. Hosting still supplies the code
that runs in your browser, so use a deployment and device you trust. If you prefer
to run your own copy for privacy or control, follow [Local use](#local-use) or
[Run with Docker](#run-with-docker) below.

### Install on mobile or desktop

The hosted version is an installable web app. Open **Connection** and choose
**Install app** to add it to your home screen or desktop app launcher, where your
browser supports installation.

- **Android:** choose **Install app**, or use the browser's installation menu.
- **iPhone or iPad:** open the site in Safari, tap **Share**, then **Add to Home Screen**.
- **Desktop:** choose **Install app**, or use your browser's address-bar or menu
  installation option. If installation is unavailable, use it in a browser tab.

The first visit and repository sync need network access. After the application
shell is cached and notes are downloaded, the installed app can browse that saved
copy offline.

### Update the installed app

Open the installed app, go to **Connection**, and choose **Update app** under
**App updates**. It downloads the latest hosted application and reloads while
preserving saved notes, connection settings and graph positions. Updating the app
does not refresh repository content; use the connection page's refresh action
separately to download newer notes. An update needs network access; a failed or
offline update leaves the existing saved copy available.

## Prerequisites

Install these before running the website locally:

- **Node.js 22.13.0 or later**: required by the application. Installing Node.js normally also installs npm.
- **npm**: used to install dependencies and run the supplied commands.
- **Git**: required by the normal data builder to discover the Markdown files committed to the second-brain repository.
- **A modern web browser**: for example Chrome, Edge, Firefox or Safari.

Python 3 is also required if you run `npm run brain:check`, because that validation command runs the Core repository checker. It is not required simply to start the demo website.

For Python validation, install the shared dependencies from the repository root
with `python -m pip install -r 2.core/scripts/requirements.txt` (or run `python setup.py`).

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

## Run with Docker

If migrating from the earlier root Compose file, run `docker compose -p second-brain-architecture -f docker-compose.yml down`
from this add-on directory once to remove the old project's containers before
starting the new project. The new default Compose project name is `browser-explorer`.

Install Docker with Compose support and start its engine (use Linux containers).
The container supplies Node.js, npm, Python and Git, so you do not need to install
those tools locally for this route. The first build needs internet access to
download the base image and dependencies.

Run the following commands from **`3.add-ons/browser-explorer/`**, where
[`docker-compose.yml`](docker-compose.yml) lives. Its build context remains the
repository root so the container can read Core and run the validation scripts.

Build and start the explorer:

```bash
docker compose up --build explorer
```

Once the server is ready, open [http://localhost:3000](http://localhost:3000).
The terminal shows server logs; keep it open while browsing. The published port
is restricted to this computer. This runs the local development explorer, using
the repository snapshot and skipping connection setup. Installable-app and
offline-shell testing use the production workflow in the next section.

To run the Core validator and explorer data check, use another terminal at the
same add-on directory:

```bash
docker compose run --build --rm checks
```

The checks container exits when finished and returns a nonzero exit code if a
check fails. Neither service mounts or modifies your host repository files.

The [Dockerfile](Dockerfile) copies a snapshot of the working tree into the image
and creates a disposable Git index without host history. This can include
uncommitted Markdown. After editing repository content or application code, stop
the explorer with Ctrl+C and rerun `docker compose up --build explorer` to refresh
the snapshot; host edits do not appear automatically.

Stop the explorer with Ctrl+C, then remove the service containers and network:

```bash
docker compose down
```

Images and build caches remain on the machine. The [build exclusions](Dockerfile.dockerignore)
omit credentials, generated data and unsupported raw sources, but permitted text
can still contain private knowledge. Keep images and caches private and never
publish an image built from a personal second brain.

## Installable app and connection testing

Stop the development server, then run these commands from `3.add-ons/browser-explorer/`:

```bash
npm run build
npm run preview
```

Open `http://localhost:4173/connection`. Production preview enables connection setup even on localhost; only development mode bypasses it. The preview is a static-file server, not a sync API. The build exports this application to `out/`, without local or demo repository data. Do not serve the repository root or development `public/` folder.

An optional adapter, selected by Plugin UUID `befe7498-69c4-4f09-913d-9b36830a9882` through the plugin registry, supplies retrieval and provider-specific setup guidance. It is not a separate application. Without it, local browsing still works. No credential is built into the app.

Connect and sync downloads Markdown from one default-branch commit. Both views use that snapshot; refresh replaces it atomically, reuses unchanged files and removes deleted files. Failed refreshes preserve the previous copy. Settings are saved in browser storage; saving the token is opt-in. Disconnect removes the connection, token and downloaded Markdown. Storage is namespaced by the application path within the browser origin. Different hostnames, ports and browsers do not share it; paths on the same origin are not a security boundary. It is not encrypted by this app and can be cleared by the browser or device.

Setup includes **Install app**, with browser-menu guidance when a prompt is unavailable. Windows and Android browsers can offer installation. On an iPhone or iPad, open the page in Safari, tap the Share button, then choose Add to Home Screen. Installation and offline shell caching are production-only. After the shell caches and content syncs, both views work offline, including reloads. Icons are bundled locally. A first visit needs network access.

When opened as an installed app, the connection page replaces the installation section with **Update app**. This downloads a fresh application shell, activates the latest available version and reloads, preserving saved notes, connection settings and graph positions. Old shell caches for this app are removed only after a successful download; failed or offline updates leave the existing shell available. Updating the app does not refresh repository content.

On mobile, localhost means the phone, not your computer. Mobile installation needs this static output served from an HTTPS address accessible to the device. The local build does not publish anything. For a URL subdirectory, set `NEXT_PUBLIC_BASE_PATH=/example` for build and preview. Routes, icons, installation scope and offline caches then use that path. Keep the value consistent between commands.

Record links now use `/record/?file=<encoded repository path>#heading`, so new files do not require rebuilding the application. Old server-rendered `/records/...` bookmarks are replaced by these links. Executable links are inert, raw HTML is not executed, and attachments/images remain outside V1.

Run `npm test` for the build and reader regression suite. Adapter-specific browser tests live with the optional adapter.

## Record links and frontmatter

The reader and knowledge graph support `[[Note Name]]`, `[[Note Name|label]]`,
`[[Note Name#Heading]]`, explicit Markdown paths and ordinary `[label](path.md)`
links. Names may match a filename, title or YAML alias; ambiguous names stay
non-clickable until replaced with an explicit path. Code examples do not create
links. The shared [Core record policy](../../2.core/system/record-structure-policy.md)
defines resolution, strict frontmatter fields and orphan warnings.

`npm run brain:check` validates YAML with the Core schema and reports isolated
notes. To reject orphans too, run `python ../../2.core/scripts/check_second_brain.py --strict-orphans`
from this directory. These checks never rewrite notes or infer relationships.

## Code organisation

Both existing search controls check file content as well as titles and paths.
Content matching ignores case and accents, supports word prefixes (for example,
`dog` matches `dogs`), and requires all query words to occur in a file. Words can
occur in different parts of the file; quotes do not request an exact phrase.
Markdown formatting is removed while code, link labels and image alt text remain
searchable. Existing title and path substring matching is preserved. The graph
continues to show only its curated records and respects the collection filter;
the Markdown reader searches every file in its snapshot.

A shared Web Worker builds and queries an in-memory FlexSearch index, with a
150 ms search debounce. Production mode saves a versioned index in the same
browser IndexedDB database as the snapshot; refresh indexes changed files and
removes deleted files, using file hashes to reuse unchanged entries. Cache or
worker failures fall back to rebuilding or scanning the saved Markdown. Disconnect
clears the cached index with the saved snapshot. Development mode indexes local
content in memory only. Search requires no server or extra repository downloads,
and the worker is bundled into the existing offline application shell.

- `app/knowledge-graph.tsx` owns graph controls, selection and detail panels. `app/use-graph-renderer.ts` owns the Cytoscape instance, layout, drag simulation, visibility and renderer recovery; effect order and cleanup keep those operations coordinated.
- `app/graph-types.ts`, `app/graph-presentation.ts` and `app/graph-positions.ts` define the graph data contract, visual configuration and existing browser position storage format. Graph types are also re-exported from the component for compatibility.
- `app/markdown-parser.ts` provides pure block parsing and heading anchors for the reader and graph. `app/records/[...path]/markdown-content.tsx` renders those blocks and shares state/event metadata-card rendering. Its existing parser exports remain available.
- `offline/snapshot.mjs` owns snapshot interpretation and Markdown index entries, shared with the local builder. The local graph's filesystem discovery and the reader's tracked-file index intentionally use different file sets.
- `app/brain-provider.tsx` coordinates retrieval, indexing and atomic snapshot persistence for every page.
- `app/content-search.ts` coordinates the shared search worker and ignores superseded queries. `offline/search-index.mjs` owns content tokenisation, incremental indexing and export/import; `app/search-filters.ts` combines its file matches with existing view filters.

The tests cover rendered Markdown, graph element generation, position storage and snapshot indexing, alongside shell and style checks. The optional adapter's browser suite exercises sync, offline reload, mobile details and canvas recovery. Run it after building when changing these lifecycles; automatic layout and device resume also deserve browser checks.

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
