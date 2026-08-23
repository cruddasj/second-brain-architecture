---
title: Source register
type: register
updated: 2026-08-23
---

# Source register

This register records explicit judgements about online sources. Appearance here does not itself mean approval.

## Status definitions

- `Candidate`: not yet approved and not user-endorsed.
- `Approved`: explicitly accepted for the recorded scope.
- `Restricted`: accepted only for recorded topics, claims or purposes.
- `Rejected`: explicitly not accepted as support for saved factual claims.

## Approved

None yet.

## Restricted

None yet.

## Rejected

None yet.

## Candidates

None yet.

Portable design findings are summarised in [Core design research](../docs/research.md). Provider-specific implementation details belong under `1.plugins/`.

## Entry format

Each source decision must include the exact source or domain, status, scope, date, the user's reason when given and dated lifecycle events.

Each entry's current status and scope are state. Its dated lifecycle is an append-only event log.
