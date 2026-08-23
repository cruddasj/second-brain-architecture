---
title: Weekly knowledge compaction task
type: system
updated: 2026-08-23
---

# Weekly knowledge compaction task

Use this task definition when running maintenance. It is not part of the normal reading path through saved knowledge.

This provider-neutral task defines a recurring maintenance operation. A scheduler or agent may invoke it, but no provider, model, hosting service or tool is part of the definition.

The user's instructions of 2026-08-20 and 2026-08-21 grant standing authority for a weekly run to make only the compaction changes permitted below and to perform the report-only theme review defined here. They do not grant authority for broader freshness corrections, new knowledge, theme creation, thematic link changes, inference, archiving, forgetting or history rewriting.

## Purpose

Reduce repeated incremental descriptions of settled past events into concise canonical historical records without changing their meaning, evidence or auditability.

A compacted record is immutable historical knowledge: it is not replaced merely because it is old. A later discovery that it was wrong must be recorded as a forward correction, preserving the earlier transaction history.

## Eligibility

A candidate is eligible only when every condition is met:

- it is curated knowledge under `2.core/knowledge/`;
- the event or closed period ended at least 12 months before the run date;
- two or more entries describe the same settled event, outcome or historical fact incrementally or repetitively;
- the details agree, or an explicit later correction clearly resolves the earlier wording;
- it has no unresolved contradiction, uncertainty that compaction could hide, active deadline, open decision or continuing state implication; and
- every distinct date, amount, entity, qualification, source label and transaction reference can be preserved.

Age alone never makes a record eligible. Current state remains mutable state even when it has not changed for a year.

## Required result

For one eligible subject page per run:

1. Replace repetitive presentation with the smallest clear canonical paragraph, list or table row that retains every distinct fact.
2. Preserve exact dates and amounts where known, retain approximate wording where precision is unknown, and keep uncertainty explicit.
3. Preserve lineage by retaining all relevant event and transaction identifiers in the compact record or a nearby lineage field.
4. Remove only redundant wording whose meaning is fully represented by the compact record.
5. Leave raw sources, the Source Register and earlier Activity Log entries unchanged.
6. Add one new Activity Log entry describing the compaction and its preserved lineage.

Compaction changes representation, not knowledge. It must not merge distinct events merely because they concern the same subject.

## Safety gates

- Read the latest canonical default branch and the Core contract and policies before judging candidates.
- Compare the proposed compact record against every source entry line by line.
- Do not infer a missing date, amount, relationship, outcome or source.
- Do not change `## Current state`, promote an event into state, or turn mutable state into an immutable record.
- Do not compact material with unresolved conflict or ambiguity. Report it instead.
- Do not archive, forget, delete raw evidence, rewrite Git history or alter provider integrations.
- Process at most one subject page in a run so the change remains reviewable and reversible.
- If no candidate passes every gate, make no repository change.

## Theme review

Every run must include a theme review, whether or not any record qualifies for compaction.

1. Read the current theme index and theme pages.
2. Review knowledge added or materially changed since the previous run, plus currently unthemed records when practical.
3. Identify one-way or broken reciprocal theme associations.
4. Identify records that have a clear match to an existing theme but are not linked to it.
5. Identify only strong, durable patterns that are distinct from existing themes and could connect more than one authoritative record or a clear continuing stream of knowledge.
6. Report each proposal with the existing or proposed theme, its purpose, the affected authoritative records and the exact reciprocal links that would be added.
7. If the correct existing theme is unclear, ask the user which theme or themes should apply.
8. If a distinct theme appears warranted, ask whether to create it and do not create it automatically.

The theme review is report-only. The standing weekly authority does not permit creating or broadening themes or adding, moving or removing thematic links. Those changes require a separate explicit instruction and normal validation.

## Transaction

When a candidate is eligible:

1. Assign a `sys-YYYYMMDD-knowledge-compaction` transaction ID, adding a suffix if needed.
2. Apply the focused page edit and prepend the Activity Log entry.
3. Update the index only if the page's purpose or route changed.
4. Run `python 2.core/scripts/check_second_brain.py` and inspect the complete diff.
5. Confirm by semantic comparison that the diff loses no distinct fact, qualifier or lineage reference.
6. Create one focused commit and make it reachable from the configured remote default branch.
7. Report the transaction ID, canonical commit SHA, exact files changed and a short before-and-after summary.

If validation, semantic comparison or canonical persistence fails, stop and report the failure without claiming completion.

## No-op report

When nothing qualifies, report that no compaction was made and identify the main reason, such as no records old enough, no repetition, unresolved uncertainty or a state-versus-event concern. Always include the result of the theme review, even when it found no link gaps or emergent-theme proposals.
