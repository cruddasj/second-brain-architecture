---
title: Knowledge compaction task
type: system
updated: 2026-09-05
---

# Knowledge compaction task

Use this task definition when running maintenance. It is not part of the normal reading path through saved knowledge.

This provider-neutral task defines a recurring maintenance operation. A scheduler or agent may invoke it, but no provider, model, hosting service or tool is part of the definition.

## Authority and cadence

- Run at a cadence selected outside Core. Scheduling configuration belongs in the relevant optional Plugin or external system.
- This task definition grants no standing write authority.
- A compaction write is permitted only when a current explicit instruction or standing authority granted separately by the user satisfies the [operating-rules Save gate](operating-rules.md#save-gate) and invokes this task.
- A bundled public architecture must not contain instance-specific standing-authority grants. Such authority belongs to the deployed second brain, not this distributable task definition.
- When write authority is absent, perform eligibility checking as report-only work and make no repository change.
- Authority to run compaction is limited to the `Required result` below. It does not authorise broader freshness corrections, new knowledge, theme creation, thematic link changes, inference, archiving, forgetting or history rewriting.

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

- Use the latest canonical default branch and the Core contract. Load policies according to the staged candidate review below before an authorised edit.
- Compare the proposed compact record against every source entry line by line.
- Do not infer a missing date, amount, relationship, outcome or source.
- Do not change `## Current state`, promote an event into state, or turn mutable state into an immutable record.
- Do not compact material with unresolved conflict or ambiguity. Report it instead.
- Do not archive, forget, delete raw evidence, rewrite Git history or alter provider integrations.
- Process at most one subject page in a run so the change remains reviewable and reversible.
- If no candidate passes every gate, make no repository change.

## Staged candidate review

1. Read the latest canonical branch and this task. Run the read-only screen before loading subject records:

   ```bash
   python 2.core/scripts/scan_compaction.py 2.core --json
   ```

2. The scanner lists pages containing at least two structured events dated at least 12 calendar months earlier. It does not establish that they concern the same settled event or closed period. Read its coverage warnings; unstructured history and closed-period end dates require semantic review.
3. If there are no candidates, report the scope and warnings and stop. An empty screen is not proof that all history is compact. A separately requested review may inspect history the screen cannot assess.
4. For a candidate, load that page and the evidence needed to apply every eligibility and safety gate. Work through candidates in path order and stop after finding one eligible page. Report any unreviewed candidates; a run may stop earlier if its configured review budget is reached.
5. Only after a page qualifies and write authority is established, load the contract's write route and the applicable freshness, relationship and theme rules. Re-read the destination before editing. No compaction can bypass semantic comparison or normal validation.

Theme review is a separate [report-only task](theme-review-task.md). A compaction invocation does not require it. Normal validation still checks links affected by an authorised edit.

## Authorised transaction

Before committing a compacted page, prepare a context-preservation review using the [compaction checker](../scripts/check_compaction.py). Retain exact before and proposed-after copies in the invocation's private temporary workspace:

```bash
python 2.core/scripts/check_compaction.py before.md after.md
python 2.core/scripts/check_compaction.py before.md after.md --review review.json
```

The first command prints a pending JSON map. Capture it using the invoking tool and complete every original nonblank Event log line with its exact before text, destination heading anchor, exact after text, an equivalence explanation and any phrases that must be retained verbatim. `retain` should include names, units, conditions, exceptions and uncertainty where rewording would risk changing meaning. Many original lines may point to one compact passage.

Review entities, conditions and exceptions, negation and uncertainty, reasons and alternatives, sources and relationships, and whether any new claim was introduced. Record an explanation for each in `checks`; mark each mapping `meaning: equivalent` and `semantic_review: confirmed` only after that comparison. The tool does not perform or approve this semantic review.

The checker binds the review to both content hashes, requires complete line coverage, checks preserved numbers, references and chosen phrases, and rejects changes outside Event log apart from the page's updated date. A failed check blocks compaction. A mechanical pass is not proof that meaning is unchanged: preserve the original wording whenever equivalence is uncertain. Keep conditions and contradictions alongside the claim they qualify. Record unstructured history as evidence rather than forcing it through compaction.

Keep the review map with the invocation evidence, outside the public scaffold. Preserve event and transaction lineage in the resulting record and retain source references. No source may be removed merely because it is quoted by the map. Link to supporting evidence in the canonical record; a temporary review file is not a durable citation.

When a candidate is eligible and write authority has been confirmed:

1. Assign the immutable UUIDv4 transaction ID required by the [source-control policy](source-control-policy.md).
2. Apply the focused page edit and prepend the Activity Log entry using that same transaction UUID.
3. Update the index only if the page's purpose or route changed.
4. Run `python 2.core/scripts/check_second_brain.py` and inspect the complete diff.
5. Confirm by semantic comparison that the diff loses no distinct fact, qualifier or lineage reference.
6. Persist the focused change using the write route defined by the source-control policy.
7. Report the transaction UUID, proposal or canonical status, commit receipt, exact files changed and a short before-and-after summary.

If validation, semantic comparison or required persistence fails, stop and report the failure without claiming completion.

## No-op report

When nothing qualifies, or when a candidate qualifies but write authority is absent, report that no compaction was made and identify the main reason. Include the scan date, branch revision, paths inspected, coverage warnings and any unreviewed candidates. A scanner failure is a failed screen, not a successful empty result.
