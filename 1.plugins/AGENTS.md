# Plugin agent entry point

This file is the automated-agent entry point for the Plugins layer.

Agents must read [CONTRACT.md](CONTRACT.md) and the authoritative [Core contract](../2.core/CONTRACT.md), then load only the plugin relevant to the task.

Do not move provider-specific instructions, metadata or compatibility material into Core or add-ons. Plugin guidance maps an integration but does not authorise a write or override Core.

When creating or substantially changing a Plugin, use [PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md) as the mandatory source for that plugin's `README.md`. Preserve the template's H1/H2 structure and section order exactly, put additional detail inside those sections or linked supporting files, identify the Core authority for each required behaviour, and link to existing Core policy rather than copying it.

Do not create a provider-specific file at repository root merely because a Plugin supports or recommends one. First explain that the proposed file is a provider-specific root-level portability exception, identify its exact filename, provider, purpose and contents, and obtain the user's explicit acceptance. If accepted, keep it as a thin activation shim and register it in [root-shims.json](root-shims.json). If declined, leave the repository root unchanged.
