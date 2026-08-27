# Plugins

Plugins contain optional provider, platform and external-system integrations. They translate provider-specific capabilities and configuration into operations governed by Core; they never become the source of truth.

For AI agentic use, start with [`1.plugins/AGENTS.md`](AGENTS.md), then follow the shared [Plugin contract](CONTRACT.md) and the authoritative [Core contract](../2.core/CONTRACT.md). Load only the plugin relevant to the task.

## Creating or changing a plugin

Use [PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md) as the authoring guide for new integrations.

Before adding provider instructions:

1. identify the Core task or policy that owns each required behaviour;
2. link to that authority instead of copying its rules;
3. keep only provider-specific configuration, identifiers, scope, tool mappings and provider-owned state in the Plugin; and
4. confirm that removing the Plugin would leave Core meaningful and usable.

Existing plugins do not need to use identical files or headings. The template defines responsibilities, not a mandatory file schema.

## Available plugins

- [OpenAI](openai/README.md): optional OpenAI connection adapter and provider-specific metadata.
- [GitHub](github/README.md): optional GitHub hosting adapter and explanation of the required root activation shim.

[portability-markers.json](portability-markers.json) is validation data used to detect named-provider leakage in Core and Add-ons. It contains no operating instructions.

Provider-specific content stays inside its Plugin. Portable findings belong in [Core design research](../2.core/docs/research.md).
