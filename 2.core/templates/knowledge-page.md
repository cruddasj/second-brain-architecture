---
title: Subject title
type: knowledge
record_id: <generate-a-UUIDv4>
aliases: []
updated: YYYY-MM-DD
---

# Subject title

Use the [record structure policy](../system/record-structure-policy.md) for identity, headings and context placement. Replace the ID placeholder once; remove these authoring instructions and empty optional sections when saving.

## Purpose and scope

State what this record covers and its boundary in one or two sentences. Do not repeat current values here.

## Current state

Keep each claim's conditions, exceptions and uncertainty in the same entry. Use a stable descriptive subheading when a claim needs a direct link.

Keep one entry for each changing current value. Replace the matching entry on update and never append a second value for the same key.

```markdown
- [state:<globally-unique-subject-key>] <current value>
  - Effective: YYYY-MM-DD
  - Last confirmed: YYYY-MM-DD
  - Source: User stated | Approved source
  - Transaction: 550e8400-e29b-41d4-a716-446655440000
```

The `Transaction` value is the immutable UUIDv4 assigned to the save transaction. Generate a fresh UUIDv4 for a new transaction and reuse that UUID only for records belonging to the same transaction.

## Uncertainty or contradictions

Record unresolved points without silently choosing one version.

## Related records

Link to another authoritative record when there is a clear, durable direct relationship. The other record must link back under its own `## Related records` section. Do not use this section for themes or source evidence, and do not copy mutable state from the linked record.

## Themes

Link to every approved existing theme using relative Markdown links. Each linked theme page must link back to this record. If the correct existing theme is unclear, or a clear distinct theme has emerged, ask the user before writing.

## Context

Add stable context that belongs to this record. Keep changing values in their authoritative record and use `## Related records` when a direct reciprocal relationship applies.

## Event log

Append timestamped things that happened. Do not rewrite or delete an earlier event during routine maintenance.

```markdown
- [event:<YYYYMMDD-subject-key>] (YYYY-MM-DD) <event>
  - Source: User stated | Approved source
  - Transaction: 9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77
```

## Change notes

Use this section only for page-structure notes that are not subject events. Git and `2.core/system/activity-log.md` hold the transaction history.
