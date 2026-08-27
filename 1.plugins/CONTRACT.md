# Plugin contract

Plugins adapt the portable second brain to a named provider, platform or external system.

For AI agentic use, start with [AGENTS.md](AGENTS.md), follow the [Core contract](../2.core/CONTRACT.md), then read the selected plugin's AGENTS and README files.

## Boundaries

A plugin may contain setup guidance, tool mappings, provider metadata and historical integration records.

Every plugin must:

- remain optional and self-contained;
- point to the Core contract;
- leave Core usable when removed;
- keep provider-specific material under `1.plugins/<provider-or-system>/`, except for a documented platform-required root shim that the user has explicitly accepted as a provider-specific root-level exception;
- contain a `README.md` created from [PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md), preserving its H1/H2 structure and section order exactly; and
- contain no secrets, credentials or live tokens.

A Plugin or setup process must never create a provider-specific root file merely because the provider supports or recommends one. Before creating such a file, disclose its exact filename, provider, purpose and proposed contents; state clearly that it adds provider-specific content to the root of the user's private Second Brain repository; and obtain explicit user acceptance. After acceptance, keep the file as a thin activation shim with no independent operating rules and register it in [root-shims.json](root-shims.json). If the user declines, leave the repository root unchanged.

A plugin cannot redefine routing, record formats, write authority, source controls, safety or persistence semantics. Documentation and dedicated agent entry points link to this contract instead of copying it.

## Authoring pattern

[PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md) is the mandatory structure for every plugin `README.md`.

When creating or substantially changing a Plugin, copy the template to `1.plugins/<provider-or-system>/README.md`, replace its instructional text with provider-specific content, and keep all template sections in the same order. Do not add, remove, rename or reorder the template sections. Put extra detail inside an existing section or in a linked supporting file.

Before adding a Plugin rule:

1. identify whether Core already owns the behaviour;
2. link to the existing Core authority when it does;
3. add only provider-specific adaptation or configuration when the behaviour is already defined; and
4. create new Core behaviour separately when the required provider-neutral behaviour has no authoritative home.

A Plugin may describe what a provider supports or how a Core operation maps to that provider. It must not restate the detailed semantics of the Core operation.

For example:

- Core decides when a pull request is required; a GitHub Plugin records that GitHub pull requests are available.
- Core decides when an item is eligible for ingestion; a storage Plugin records the provider fields, folder IDs and timestamps used to evaluate that rule.
- Core defines persistence and save completion; an AI-provider Plugin records connection and invocation behaviour.
