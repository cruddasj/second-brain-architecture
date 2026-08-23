# OpenAI plugin agent entry point

This file is the automated-agent entry point for the OpenAI plugin.

Agents must follow the [Core contract](../../2.core/CONTRACT.md) and [Plugin contract](../CONTRACT.md), then use [project-instructions.md](project-instructions.md) only as the OpenAI connection adapter.

Provider discovery metadata lives under `skills/`. Do not copy provider-specific instructions or metadata into Core or add-ons.
