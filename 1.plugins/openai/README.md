---
title: OpenAI plugin
type: integration
updated: 2026-08-23
---

# OpenAI plugin

This optional plugin contains OpenAI-specific connection guidance and discovery metadata. It has no authority over the [Core contract](../../2.core/CONTRACT.md).

## Using this plugin

Use the [Core overview](../../2.core/README.md) and [Second-brain index](../../2.core/index.md) for the main second-brain guidance and saved knowledge. Read this plugin only when configuring or reviewing an OpenAI connection.

## AI agent use

AI agents follow [AGENTS.md](AGENTS.md), the [Plugin contract](../CONTRACT.md) and the [Core contract](../../2.core/CONTRACT.md), then use [project-instructions.md](project-instructions.md) as the connection adapter.

## Active material

- [project-instructions.md](project-instructions.md): template adapter for a connected private repository.

Provider-neutral reusable skills remain under `3.add-ons/skills/`; provider-specific discovery metadata should be added here only when an integration actually requires it.

## Compatibility research

Provider-specific research may inform adapters but is not architectural authority. Portable architectural findings are retained in [Core design research](../../2.core/docs/research.md).
