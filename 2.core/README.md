# Core

Core is the portable, text-only second brain. It contains the canonical knowledge, memory model, sources, templates, governance and validator.

Start with the [Second-brain index](index.md) to browse and navigate saved knowledge. Read system policies when reviewing how the repository is governed.

For AI agentic use, read [AGENTS.md](AGENTS.md), then the shared [operating contract](CONTRACT.md). Use the contract's task-context table to load the applicable policies before acting.

## What Core contains

| Area | Purpose |
| --- | --- |
| `memory/` | Small, high-value current state used across topics |
| `knowledge/` | Authoritative personal knowledge and continuing projects |
| `themes/` | Navigation across related records |
| `sources/` | Raw evidence and derived source notes |
| `templates/` | Standard text-file shapes |
| `system/` | Governance, validation and activity history |
| `docs/` | Design rationale and research |

Core remains independent of any named AI provider. Plugin-backed sources use
the opaque references defined by the
[source reference policy](system/source-reference-policy.md). Provider-specific
setup, resource labels and resolution details belong under
[Plugins](../1.plugins/README.md), while optional products and tools belong
under [Add-ons](../3.add-ons/README.md).
