---
title: Subject title
type: knowledge
updated: YYYY-MM-DD
---

# Subject title

## Themes

Link to every approved existing theme using relative Markdown links. Each linked theme page must link back to this record. If the correct existing theme is unclear, or a clear distinct theme has emerged, ask the user before writing.

## Current state

Keep one entry for each changing current value. Replace the matching entry on update and never append a second value for the same key.

```markdown
- [state:<globally-unique-subject-key>] <current value>
  - Effective: YYYY-MM-DD
  - Last confirmed: YYYY-MM-DD
  - Source: User stated | Approved source
  - Transaction: <transaction-id>
```

## Event log

Append timestamped things that happened. Do not rewrite or delete an earlier event during routine maintenance.

```markdown
- [event:<YYYYMMDD-subject-key>] (YYYY-MM-DD) <event>
  - Source: User stated | Approved source
  - Transaction: <transaction-id>
```

## Context and links

Link to authoritative state elsewhere rather than copying a mutable value.

## Uncertainty or contradictions

Record unresolved points without silently choosing one version.

## Change notes

Use this section only for page-structure notes that are not subject events. Git and `2.core/system/activity-log.md` hold the transaction history.
