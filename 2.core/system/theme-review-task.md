---
title: Theme review task
type: system
updated: 2026-09-05
---

# Theme review task

This task reviews navigation without changing knowledge or theme links. It is independent of [compaction](knowledge-compaction-task.md). Use the [theme and decision policy](theme-and-decision-policy.md) for association semantics and the [Core contract](../CONTRACT.md) for authority.

## Inputs and scope

- Latest canonical default-branch revision and run date.
- Theme index, approved theme pages relevant to the selected records, and their authoritative records.
- Previous successful review revision, when supplied by the invoking system. Keep scheduler checkpoints outside Core; a report-only run cannot update the repository.

For a routine run, select knowledge added, changed, moved or removed since the previous reviewed revision, and the counterparts of changed theme links. Include records linked by changed theme pages. Use the selected integration's revision comparison; confirm the baseline is an ancestor of the current canonical revision.

If the baseline is missing, invalid or unavailable, report that limitation and perform a bounded sample, or a full review when explicitly requested. State the sampling rule and inspected paths. Do not claim complete coverage or advance a full-review checkpoint after a partial or failed run.

A scheduler may request a wider review periodically, for example quarterly, to find gaps in unchanged or unthemed records. Cadence and checkpoint retention belong to the invoking integration, not this task.

## Procedure

1. Run `python 2.core/scripts/check_second_brain.py` for deterministic broken and non-reciprocal theme-link checks. Report failures; do not repair links during this task.
2. Establish the review scope above. With a valid baseline and no relevant changes, report a no-op without loading all theme or knowledge pages.
3. Read the selected records and relevant approved themes. Exclude scaffold examples until explicitly approved for the instance.
4. Identify clear missing associations with existing themes and strong, durable patterns that may justify a new theme. Use policy criteria; do not infer a relationship from filenames alone.
5. Report each proposal with its purpose, affected records and exact reciprocal links. Surface ambiguous classifications as questions, using the operating rules' unattended fallback when necessary.

## Result

Report run date, branch revision, baseline, inspected paths, validation result, proposals and coverage limits. State whether the review covered the complete selected range or only a sample. Findings grant no authority to create themes, change associations or append an Activity Log entry. Later authorised changes follow the normal save workflow.
