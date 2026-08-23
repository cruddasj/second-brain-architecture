# GitHub plugin agent entry point

This file is the automated-agent entry point for the GitHub plugin.

Agents must follow the [Plugin contract](../CONTRACT.md) and [Core contract](../../2.core/CONTRACT.md). Treat root `.github/` files as platform activation shims. Keep architecture and record rules in Core, and keep add-on implementation provider-neutral.
