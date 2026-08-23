---
title: Second-brain index
type: index
updated: 2026-08-23
---

# Second-brain index

This is the main navigation page for a new second brain. The public scaffold intentionally contains no personal records.

## Saved knowledge

Knowledge pages are stored under `knowledge/` and organised into these starting areas:

- `about-me/`
- `work/`
- `projects/`
- `life-admin/`
- `interests-and-learning/`
- `health-and-wellbeing/`
- `people-and-relationships/`

Add records only when the user explicitly authorises them. Each saved page must follow the Core contract and use the appropriate template.

### Themes

- [Theme index](themes/index.md): navigation across approved themes. The public scaffold starts with an empty generic Finances theme as an example of the theme structure.
- [Finances](themes/finances.md): empty example theme with no personal records.

### Cross-topic memory

- [Core memory](memory/core.md): small, high-value current state and pointers used across topics. It is empty in the public scaffold.

## System guide

- [Core overview](README.md): what Core contains and where to start.
- [Design research](docs/research.md): the provider-neutral ideas behind the architecture.
- [Plugins](../1.plugins/README.md): optional provider and external-system integrations.
- [Add-ons](../3.add-ons/README.md): optional provider-neutral skills, websites and tools.

## Governance and AI agent material

For AI agentic use, start with [Core AGENTS.md](AGENTS.md) and follow the [operating contract](CONTRACT.md).

- [Directory and routing](system/directory.md): folder purposes and ambiguity rules.
- [Operating rules](system/operating-rules.md): retrieval and authorised-save workflow.
- [Freshness policy](system/freshness-policy.md): state, events and contradiction handling.
- [Freshness audit task](system/freshness-audit-task.md): recurring report-only review of current claims using deterministic scan candidates.
- [Source-control policy](system/source-control-policy.md): commit, correction and forgetting semantics.
- [Theme and decision policy](system/theme-and-decision-policy.md): relationships, saved decisions and reviews.
- [Knowledge compaction task](system/knowledge-compaction-task.md): controlled weekly historical consolidation.
- [Source register](system/source-register.md): source status and approved scope.
- [Activity log](system/activity-log.md): append-only history of authorised changes.

## Templates

- [Knowledge page](templates/knowledge-page.md)
- [Project page](templates/project-page.md)
- [Decision record](templates/decision-record.md)
- [Source note](templates/source-note.md)

Optional implementation details remain visible through the Plugins and Add-ons indexes, but they are not part of the normal reading path.
