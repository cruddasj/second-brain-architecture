---
title: Recurring freshness audit task
type: system
updated: 2026-08-23
---

# Recurring freshness audit task

This provider-neutral task defines a recurring, read-only review of current knowledge. A scheduler, agent or person may invoke it. No provider, model, hosting service, account, API or scheduling product is part of the definition.

This task is separate from [weekly knowledge compaction](knowledge-compaction-task.md). Freshness auditing finds claims that may no longer be true; compaction reduces repeated descriptions of settled history. One must not be treated as authority to perform the other.

## Authority and cadence

- Run periodically at a cadence selected outside Core. Weekly is the recommended starting point while the repository changes frequently.
- Scheduling configuration belongs in the relevant optional plugin or external system, never in Core.
- A run authorises reading and reporting only.
- It does not authorise correcting knowledge, changing current state, adding events, moving records, changing themes, archiving, forgetting or rewriting history.
- Any proposed correction requires a separate explicit instruction and the normal Core transaction workflow.

## Required inputs

- the latest canonical default-branch copy of the repository;
- the [Core contract](../CONTRACT.md), [operating rules](operating-rules.md) and [freshness policy](freshness-policy.md);
- `2.core/memory/core.md` as the first always-loaded surface;
- the current Core index and relevant authoritative records; and
- the read-only deterministic scanner at `2.core/scripts/audit_freshness.py`.

## Procedure

1. Confirm that the audit is using the latest canonical default branch and record the run date.
2. Read `2.core/memory/core.md` completely and list every current-sounding claim.
3. Run the deterministic scanner against Core. Use JSON output when another process will consume the results:

   ```bash
   python 2.core/scripts/audit_freshness.py 2.core --always-loaded memory/core.md --json
   ```

4. Add one or more `--subject "Subject name"` arguments when a claim contains monetary or percentage values that should be compared across matching lines.
5. Treat duplicate keys, old confirmation dates and differing comparable values as review candidates, not conclusions.
6. For each always-loaded claim, search the current repository for the freshest relevant evidence and classify it as:
   - **Confirmed:** current evidence agrees;
   - **Contradicted:** newer or stronger evidence disagrees; or
   - **Unsupported:** no saved evidence supports it.
7. Inspect scanner candidates and a practical sample of detailed pages for lifecycle conflicts, copied mutable state and facts that were recorded as events but never promoted to current state.
8. Report the most damaging contradiction first, followed by other contradictions, unsupported claims, stale-confirmation candidates and coverage limits.
9. Propose at most one focused correction location for each distinct issue. Do not edit it during the audit.
10. If no issue is found, report the scope checked and the scanner's coverage warnings. Never describe an empty scan as proof that the repository is fresh.

## Scanner interpretation

The scanner performs only repeatable checks that do not require semantic judgement:

- inventorying structured state entries;
- locating duplicate state keys and distinguishing identical from differing summaries;
- identifying missing, invalid or old `Last confirmed` dates;
- listing state claims in nominated always-loaded files; and
- finding differing monetary or percentage values on lines matching an explicitly supplied subject.

Different values can describe different events, periods or measures. The scanner therefore reports candidates and exits successfully when it finds them. An agent or person must decide whether they are actual contradictions.

## Required report

Every run reports:

1. run date, canonical branch status and paths inspected;
2. deterministic scanner summary and coverage warnings;
3. confirmed, contradicted and unsupported always-loaded claims;
4. other candidate conflicts, ordered by likely effect on future answers;
5. any proposed focused corrections and the evidence for each; and
6. a clear statement that no repository write was made.

Do not append an Activity Log entry for a report-only run because Core did not change. If the user later authorises a correction, that correction receives its own transaction ID, validation, Activity Log entry and canonical commit.
