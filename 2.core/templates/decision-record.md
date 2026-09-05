---
title: Decision title
type: decision
record_id: <generate-a-UUIDv4>
aliases: []
dashboard: false
updated: YYYY-MM-DD
---

# Decision title

Use the [record structure policy](../system/record-structure-policy.md) for identity, headings and context placement. Replace the ID placeholder once; remove these authoring instructions and empty optional sections when saving.

## Question

State the question as it was asked, including the date when known.

## Current state

Keep each claim's conditions, exceptions and uncertainty in the same entry. Use a stable descriptive subheading when a claim needs a direct link.

- [state:<globally-unique-decision-status-key>] Pending review
  - Effective: YYYY-MM-DD
  - Last confirmed: YYYY-MM-DD
  - Source: User stated
  - Transaction: 550e8400-e29b-41d4-a716-446655440000

The `Transaction` value is the immutable UUIDv4 assigned to the save transaction. Generate a fresh UUIDv4 for a new transaction and use that same UUID throughout the transaction.

## Uncertainty or contradictions

Record unresolved points without silently choosing one version.

## Related records

Use labelled, reciprocal Markdown links for clear dependencies or context. See the [relationship policy](../system/record-relationship-policy.md).

## Themes

Link to every approved existing theme using relative Markdown links. Each linked theme page must link back to this record. If the correct existing theme is unclear, or a clear distinct theme has emerged, ask the user before writing.

## Context

Record only the minimum context explicitly authorised for saving.

## Options considered

### Option A

- Description:
- Benefits:
- Drawbacks:
- Evidence or source:

### Option B

- Description:
- Benefits:
- Drawbacks:
- Evidence or source:

## Decision

- Chosen option:
- Reasoning:
- Decision source: User stated

## Review plan

- Review on: YYYY-MM-DD
- Original aims:
- Measures:
- Evidence to collect:
- Conditions that would trigger reconsideration:

## Outcome review

- Outcome: Pending | Sensible | Mixed | Reconsider | Superseded
- Evidence:
- Result against original aims:
- Effect of outside factors:
- Lesson:
- Proposed follow-up:

## Event log

- [event:<YYYYMMDD-decision-made-key>] (YYYY-MM-DD) Decision made.
  - Source: User stated
  - Transaction: 9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77

## Sources

Link only to sources whose recorded status and scope permit this use.
