# Plugins

Plugins contain optional provider, platform and external-system integrations. They translate provider-specific capabilities and configuration into operations governed by Core; they never become the source of truth.

For AI agentic use, start with [`1.plugins/AGENTS.md`](AGENTS.md), then follow the shared [Plugin contract](CONTRACT.md) and the authoritative [Core contract](../2.core/CONTRACT.md). Load only the plugin relevant to the task.

## Creating or changing a plugin

Every plugin must contain a `README.md` created from [PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md).

The plugin README must preserve the template's H1/H2 structure and section order exactly. Do not add, remove, rename or reorder template sections. Put extra provider-specific detail inside the existing sections or in linked supporting files under the same plugin directory.

Before adding provider instructions:

1. identify the Core task or policy that owns each required behaviour;
2. link to that authority instead of copying its rules;
3. keep only provider-specific configuration, identifiers, scope, tool mappings and provider-owned state in the Plugin; and
4. confirm that removing the Plugin would leave Core meaningful and usable.

Supporting files may use structures suited to their purpose, but the plugin's `README.md` must always use `PLUGIN_TEMPLATE.md`.

Every Plugin also has one immutable UUIDv4 in
[plugin-registry.json](plugin-registry.json). Core uses that opaque ID when a
source depends on a Plugin. The selected Plugin owns the provider name, native
resource field, URL construction and retrieval mapping, while Core stores only
the neutral `Plugin ID` and `Plugin provider resource ID` fields defined by
the
[source reference policy](../2.core/system/source-reference-policy.md).

### Provider-specific root files

The public architecture keeps the repository root provider-neutral. Installing or configuring a Plugin must not automatically add a provider-specific file at repository root.

If a provider requires a root compatibility file, treat it as an explicit portability exception. Before creating it:

1. tell the user the exact filename and provider;
2. explain why the provider needs it and what it will contain;
3. state clearly that accepting it will add AI-provider-specific content to the root of their private Second Brain repository; and
4. obtain explicit user acceptance for that root-level exception.

Only after that acceptance may the setup create the file. It must remain a thin activation shim with no independent operating rules, be explained by the Plugin that requires it, and be registered in [root-shims.json](root-shims.json) so validation can keep it constrained.

If the user declines, leave the root unchanged and use an alternative invocation path where the provider supports one.

## Minimum AI integration capabilities

An AI product is a viable read-write Plugin candidate when it can, within an explicitly authorised scope:

- read repository text at a specified ref or otherwise establish the repository state Core requires;
- make a repository change or produce a reviewable proposed change through some supported mechanism; and
- follow instructions across multiple linked repository files rather than relying on one copied prompt.

A product that can read the repository and follow the linked instructions but cannot make or propose changes can still use a **read-only Plugin**. Lack of write capability should narrow the Plugin's scope rather than force provider-specific write semantics into Core.

## Portability coverage

The bundled AI Plugins deliberately exercise materially different integration shapes:

- [OpenAI](openai/README.md) represents a connected-repository environment; and
- [Claude](claude/README.md) represents a local-checkout coding-agent environment with direct file, shell and Git access.

This is architecture-level coverage of the Plugin/Core boundary, not a claim that every product, feature or version has been field-tested.

## Available plugins

- [OpenAI](openai/README.md): optional OpenAI connection adapter and provider-specific metadata.
- [Claude](claude/README.md): optional Claude Code local-checkout adapter, with opt-in compatibility guidance for private repositories.
- [GitHub](github/README.md): optional GitHub hosting adapter and explanation of the required root activation shim.

[portability-markers.json](portability-markers.json) is validation data used to detect named-provider leakage in Core and Add-ons. It contains no operating instructions.

[plugin-registry.json](plugin-registry.json) maps stable opaque Plugin IDs to
their adapter directories. It contains no account identifiers, credentials or
personal configuration.

Provider-specific content stays inside its Plugin. Portable findings belong in [Core design research](../2.core/docs/research.md).
