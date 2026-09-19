---
title: Task service pilot selection
type: decision
record_id: 876c3a7d-2f4e-4187-a98c-57fceb1227bf
aliases: []
dashboard: false
updated: 2026-01-15
---

# Task service pilot selection

Synthetic teaching example, not a real decision or user preference.

## Question

On 2026-01-15, which service should enter a limited pilot for the fictional team?

## Current state

- [state:example-task-service-decision-status] Task Orchard selected for a synthetic-data pilot, conditional on attachment export verification.
  - Effective: 2026-01-15
  - Last confirmed: 2026-01-15
  - Source: Fictional scenario decision
  - Transaction: 550e8400-e29b-41d4-a716-446655440000

## Related records

- [Evaluation project](project.md): owns progress and the outstanding test.

## Options considered

| Option | Benefit | Drawback | Evidence |
| --- | --- | --- | --- |
| Task Orchard | Preserved comments | Higher quote; slower task entry | [Summary](source-note.md) |
| Task Meadow | Lower quote; faster task entry | Lost comments on export | [Summary](source-note.md) |
| Defer selection | Allows a wider trial | Delays pilot learning | Scenario trade-off, not a measurement |

## Decision

Choose Task Orchard for the limited pilot because preserving history is the primary
criterion. This is not production procurement approval. The fictional scenario
supplies decision authority; evidence alone does not.

## Review plan

- Review on: 2026-02-15
- Original aim: portable task history without unacceptable operational friction.
- Measures: all 100 titles, 200 comments and 10 test attachments export intact.
- Evidence to collect: export/import comparison and pilot usability notes.
- Reconsider if: an attachment is missing or the export cannot be re-imported.

## Outcome review

Pending in this fictional scenario; no production outcome is asserted.

## Event log

- [event:20260115-example-task-service-pilot-selected] (2026-01-15) The fictional team selected a conditional pilot.
  - Source: Fictional scenario decision
  - Transaction: 550e8400-e29b-41d4-a716-446655440000

## Sources

- [Evidence summary](source-note.md), derived from the [trial report](trial-report.md).
