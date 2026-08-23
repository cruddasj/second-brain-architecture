# Plugins

Plugins contain optional provider, platform and external-system integrations. They translate provider-specific actions into operations governed by Core; they never become the source of truth.

Read a plugin README when reviewing setup, compatibility or integration history. For AI agentic use, start with [`1.plugins/AGENTS.md`](AGENTS.md), then follow the shared [Plugin contract](CONTRACT.md) and the authoritative [Core contract](../2.core/CONTRACT.md). Load only the plugin relevant to the task.

## Available plugins

- [OpenAI](openai/README.md): optional project adapter, provider metadata and consolidated integration history.
- [GitHub](github/README.md): current repository hosting configuration and explanation of the required root activation shim.

[portability-markers.json](portability-markers.json) is validation data used to detect named-provider leakage in Core and add-ons. It contains no operating instructions.

Provider-specific content stays inside its plugin. Portable findings belong in [Core design research](../2.core/docs/research.md).
