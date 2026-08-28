---
title: Decision title
type: decision
decision_id: dec-YYYYMMDD-short-slug
status: pending
asked: YYYY-MM-DD
decided: YYYY-MM-DD
review_on: YYYY-MM-DD
dashboard: false
updated: YYYY-MM-DD
---

# Decision title

## Themes

Link to every approved existing theme using relative Markdown links. Each linked theme page must link back to this record. If the correct existing theme is unclear, or a clear distinct theme has emerged, ask the user before writing.

## Question

State the question as it was asked.

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

## Current state

- [state:<globally-unique-decision-status-key>] Pending review
  - Effective: YYYY-MM-DD
  - Last confirmed: YYYY-MM-DD
  - Source: User stated
  - Transaction: 550e8400-e29b-41d4-a716-446655440000

The `Transaction` value is the immutable UUIDv4 assigned to the save transaction. Generate a fresh UUIDv4 for a new transaction and use that same UUID throughout the transaction.

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

## Uncertainty or contradictions

Record unresolved points without silently choosing one version.
