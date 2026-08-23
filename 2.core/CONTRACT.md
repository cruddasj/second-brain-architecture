# Second-brain operating contract

This is the provider-neutral authority for Core. It defines the rules; the linked policies define the detailed procedures. Plugins and add-ons cannot override it.

For AI agentic use, start with [AGENTS.md](AGENTS.md), then read this contract. For a task that may depend on saved knowledge, continue through:

1. [memory/core.md](memory/core.md)
2. [index.md](index.md)
3. [system/directory.md](system/directory.md)
4. the relevant authoritative record

Before writing, also read [operating-rules.md](system/operating-rules.md), [freshness-policy.md](system/freshness-policy.md), [source-control-policy.md](system/source-control-policy.md) and the destination file.

## Core invariants

- **Authority:** the user's current explicit instruction comes first, followed by this contract and its policies, canonical saved knowledge, approved sources and optional plugin guidance.
- **Canonical state:** only the configured remote default branch is remembered. Conversations, local edits, topic branches and open pull requests are not canonical knowledge.
- **Default is read-only:** discussion, research, recommendations, links and uploads do not authorise a repository write.
- **Explicit saves:** write only after a clear instruction to remember, save, record, add, update, correct or remove information.
- **Text-only Core:** Core knowledge, instructions and processes are plain text and remain usable without a named AI provider, product, model, API, SDK or managed memory service.
- **One authoritative home:** keep each changing value in one place and link to it elsewhere.
- **State and events:** replace a changing current state; append a dated event.
- **User confirmation:** ask when the destination, state-versus-event classification, theme association, safety or requested operation is materially unclear.
- **Minimum useful content:** retain only what is needed for later retrieval, including source, date and transaction lineage.
- **Safety:** never store secrets or authentication material, and minimise sensitive or third-party personal information.

## Policy ownership

Each rule should have one detailed home:

| Subject | Detailed authority |
| --- | --- |
| Folder choice and naming | [Directory and routing](system/directory.md) |
| Read and authorised-save workflow | [Operating rules](system/operating-rules.md) |
| Current state, events and contradictions | [Freshness policy](system/freshness-policy.md) |
| Commits, pull requests, corrections and forgetting | [Source-control policy](system/source-control-policy.md) |
| Sources and their approved scope | [Source register](system/source-register.md) |
| Themes and saved decisions | [Theme and decision policy](system/theme-and-decision-policy.md) |
| Scheduled freshness review | [Freshness audit task](system/freshness-audit-task.md) |
| Scheduled historical consolidation | [Knowledge compaction task](system/knowledge-compaction-task.md) |

Summaries in other files must link to these authorities rather than restating their full rules.

## Authorised write outcome

A completed write must:

1. start from the latest remote default branch;
2. use one transaction ID;
3. update the existing authoritative page where possible;
4. apply the state, event, source and theme rules;
5. update the index only when navigation changed;
6. append one Activity Log entry;
7. pass `python 2.core/scripts/check_second_brain.py`;
8. remain one focused commit or pull request under the source-control policy;
9. become reachable from the remote default branch before it is called remembered; and
10. report the transaction ID, commit status and exact files changed.

Do not claim that a save completed if validation, canonical persistence or required logging failed.

## Layer boundaries

- **Core** contains provider-neutral knowledge, instructions, processes, templates and governance.
- **Plugins** contain optional provider, platform and external-system adapters. They may map tools and setup, but cannot redefine Core.
- **Add-ons** contain optional provider-neutral skills, websites and other products built above Core.
- Removing a plugin or add-on must not invalidate Core.
- A platform-required root shim must be explained by its plugin and contain no independent architecture.
- Provider-specific research, metadata and compatibility material stays in the matching plugin.

## Corrections and removal

Correct ordinary knowledge with a later forward commit. Archive, logical forgetting, revert and historical erasure are different operations and require the safeguards in the source-control policy. Confirm the exact target and mode before any destructive or privacy-sensitive change.
