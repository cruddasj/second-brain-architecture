---
title: Project title
type: knowledge
updated: YYYY-MM-DD
---

# Project title

## Themes

Link to every approved existing theme using relative Markdown links. Each linked theme page must link back to this record. If the correct existing theme is unclear, or a clear distinct theme has emerged, ask the user before writing.

## Related records

Link to another authoritative record when there is a clear, durable direct relationship. The other record must link back under its own `## Related records` section. Do not use this section for themes or source evidence, and do not copy mutable state from the linked record.

## Current state

Use one globally unique key for each changing value, for example project status, current owner, next milestone or active constraint.

```markdown
- [state:<project-key>-status] <current value>
  - Effective: YYYY-MM-DD
  - Last confirmed: YYYY-MM-DD
  - Source: User stated | Approved source
  - Transaction: 550e8400-e29b-41d4-a716-446655440000
```

The `Transaction` value is the immutable UUIDv4 assigned to the save transaction. Generate a fresh UUIDv4 for a new transaction and use that same UUID anywhere the transaction is referenced.

## Event log

Append decisions, completed milestones and other dated occurrences.

```markdown
- [event:<YYYYMMDD-project-key-decision>] (YYYY-MM-DD) <event>
  - Source: User stated | Approved source
  - Transaction: 9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77
```

## Purpose

## Confirmed constraints

Express a changing constraint as state. Put the dated decision that introduced it in the Event log when useful.

## Open questions

## Relevant saved preferences

Link to the authoritative record rather than copying the same preference. Use `## Related records` when the relationship is direct and durable.

## Sources

Use only sources whose status and scope permit the intended use.

## Uncertainty or contradictions
