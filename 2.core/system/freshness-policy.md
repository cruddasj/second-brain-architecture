---
title: Freshness and contradiction policy
type: system
updated: 2026-08-28
---

# Freshness and contradiction policy

This policy governs knowledge freshness and contradictions. For normal navigation through saved knowledge, use the [Core index](../index.md).

This policy adapts the state-versus-event model described by Cole Medin. It prevents an append-only knowledge base from accumulating several answers to a question whose answer should be singular and current.

## Classify before writing

Every authorised fact is one of two kinds.

| Kind | Meaning | Correct write |
| --- | --- | --- |
| State | One current value that can change | Replace the matching entry under `## Current state` and date it |
| Event | A timestamped thing that happened | Append it under `## Event log` or a register's lifecycle section |

Examples of state include a preference, current status, owner, price, plan, tool version or deadline. Examples of events include a decision, completed task, payment, installation, meeting outcome or lesson learned.

The classification is about meaning, not grammar. A sentence in a dated conversation may still update current state. If classification is unclear and would change which material is replaced or retained, ask the user before writing.

## One authoritative state home

- Give every state entry a globally unique key such as `state:project-atlas-status`.
- Keep one value for that key in the whole current knowledge surface.
- Use `2.core/memory/core.md` only for high-value state needed across many conversations.
- Keep topic-specific state on the relevant subject page.
- Link to an authoritative state instead of copying its mutable value elsewhere.
- Registers treat current status as state and their dated lifecycle entries as events.
- The newest mention is evidence, not automatic authority. A current explicit user instruction outranks an older file. If two saved claims conflict and authority is unclear, ask.

## State update workflow

1. Search the repository for the subject and state key.
2. Read the existing authoritative entry and the freshest relevant evidence.
3. Confirm that the new instruction is a state update, not a separate event or subject.
4. Replace the existing state entry and update its effective, confirmation and transaction metadata.
5. Preserve the former state verbatim as a dated event when it remains useful history, unless the user explicitly asked to forget it.
6. Remove or replace any copied mutable value with a link to the authoritative entry.
7. Validate and commit the complete transaction.

## Event workflow

1. Append the event to the relevant subject page or register.
2. Include when it happened, its source and the transaction ID.
3. Do not edit or delete an earlier event during routine maintenance. Correct it with a later event that identifies the error.
4. If the event implies that current state changed, update the authoritative state in the same transaction or ask when the intended new state is unclear.

## Read-only freshness audit

An instruction to audit, review or check freshness authorises inspection and a report, not a knowledge write.

1. Establish the actual repository shape and identify the always-loaded surface, beginning with `2.core/memory/core.md`.
2. Read that surface completely and extract every current-sounding state claim.
3. Search the rest of the default branch for the freshest relevant evidence.
4. Classify each claim as:
   - **Confirmed:** current evidence agrees.
   - **Contradicted:** newer or stronger evidence disagrees.
   - **Unsupported:** no saved evidence supports the claim.
5. Inspect a sample of detailed pages for lifecycle conflicts, copied state and facts that were never promoted from events.
6. Report the most damaging contradiction first, then other contradictions and unsupported claims.
7. Propose a focused diff for one location at a time. Do not bulk-convert pages.
8. Write only after the user explicitly approves the exact correction and destination.
9. Re-run validation and, where practical, repeat the question that previously returned the stale answer.

An empty automated scan is not proof of freshness. Dates and scripts help count and locate candidates, but an agent or person must judge meaning and authority.

The provider-neutral [recurring freshness audit task](freshness-audit-task.md) applies this procedure on a schedule. Its deterministic scanner, `2.core/scripts/audit_freshness.py`, inventories structured state, old confirmation dates, duplicate keys and subject-matched monetary or percentage differences. Scanner findings are candidates only and never authorise a correction.

## Retrieval rule

Use current state for what is true now. Use events to explain how it changed. Do not let an old event override current state merely because it is detailed or appears first in search results. Surface unresolved contradictions instead of choosing silently.

## Save gate still applies

Do not auto-capture chats, daily summaries, integrations or external material. A scheduled audit may report findings, but it must not change curated knowledge unless the user's separate write instruction satisfies the normal save gate.

- A general freshness audit remains report-only and never auto-corrects.
- Knowledge compaction may modify curated history only when a current instruction or separately granted standing authority satisfies the [operating-rules Save gate](operating-rules.md#save-gate). The [`knowledge-compaction-task.md`](knowledge-compaction-task.md) constrains that operation but grants no authority by itself.
- Any finding outside an authorised compaction operation requires a separate explicit write instruction.
