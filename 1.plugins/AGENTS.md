# Plugin agent entry point

This file is the automated-agent entry point for the Plugins layer.

Agents must read [CONTRACT.md](CONTRACT.md) and the authoritative [Core contract](../2.core/CONTRACT.md), then load only the plugin relevant to the task.

Do not move provider-specific instructions, metadata or compatibility material into Core or add-ons. Plugin guidance maps an integration but does not authorise a write or override Core.

When creating or substantially changing a Plugin, use [PLUGIN_TEMPLATE.md](PLUGIN_TEMPLATE.md) as the authoring guide. Identify the Core authority for each required behaviour before adding provider-specific instructions, and link to existing Core policy rather than copying it.
