# Add-ons

Add-ons are optional tools and products built above the Core contracts.

Their workflow behaviour and content remain provider-neutral. The architecture may still use shared cross-provider packaging conventions such as `AGENTS.md`, `SKILL.md` and generic manifests when those conventions are defined by the Add-on contracts. Provider-specific discovery, installation, activation and compatibility material belongs only under `1.plugins/`.

Read [`CONTRACT.md`](CONTRACT.md) for the portability and packaging boundary. For AI agentic use, read [`AGENTS.md`](AGENTS.md).

Current Add-ons:

- [`knowledge-retrieval/`](knowledge-retrieval/README.md): revision-bound search and context-preserving Markdown retrieval.
- [`browser-explorer/`](browser-explorer/README.md): read-only browser view and local skill-draft interface.
- [`skills/`](skills/README.md): provider-neutral skill catalogue, lifecycle and authoring rules.

Removing every Add-on must leave Core usable and every Plugin structurally valid.
