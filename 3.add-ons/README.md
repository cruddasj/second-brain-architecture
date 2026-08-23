# Add-ons

Add-ons are optional tools and products built above the Core contracts.

Every add-on must remain strictly AI-provider agnostic in its code, instructions, formats, examples and documentation. Provider adapters and compatibility material belong only under `1.plugins/`.

Read [`CONTRACT.md`](CONTRACT.md) for the provider-neutral boundary. For AI agentic use, read [`AGENTS.md`](AGENTS.md).

Current add-ons:

- [`browser-explorer/`](browser-explorer/README.md): read-only browser view and local skill-draft interface.
- [`skills/`](skills/README.md): provider-neutral skill catalogue, lifecycle and authoring rules.

Removing every add-on must leave Core usable and every plugin structurally valid.
