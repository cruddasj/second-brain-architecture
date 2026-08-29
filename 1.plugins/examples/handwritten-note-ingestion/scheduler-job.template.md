---
title: Handwritten notes inbox schedule
type: integration
updated: <YYYY-MM-DD>
---

# Handwritten notes inbox schedule

This file belongs under the selected scheduler or AI-provider Plugin. It records how and when the provider-neutral Core task is invoked. It does not grant or widen write authority.

## Job

| Setting | Value |
| --- | --- |
| Core task | `2.core/system/source-inbox-ingestion-task.md` |
| Source Plugin | `1.plugins/<source-provider>/README.md` |
| Schedule | `<cadence and local time>` |
| Time zone | `<IANA time zone>` |
| Manual trigger | `<optional provider-specific invocation>` |
| Authority | `<proposal-only, source-note-only, or explicitly granted bounded curation>` |

## Invocation instructions

On every run:

1. start from the latest canonical default branch;
2. reload the Core contract, task, source Plugin configuration and processed register;
3. use the schedule only to invoke the task, never as authority to write;
4. preserve the source Plugin's exact scope and restrictions;
5. report no-op, failure and pending-decision outcomes; and
6. do not claim completion until the Core task's completion conditions are met.

If the connected source or repository cannot be read, if discovery coverage is incomplete, or if the task needs authority that has not been granted, stop safely and report the limitation.
