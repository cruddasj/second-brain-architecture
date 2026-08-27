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
- **User confirmation:** ask when the destination, state-versus-event classification, theme association, safety or requested operation is materially unclear; use the [unattended ambiguity fallback](system/operating-rules.md#unattended-ambiguity) when no user is present.
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
| Source and evidence destinations | [Directory and routing](system/directory.md) |
| Source-inbox task orchestration | [Operating rules](system/operating-rules.md) |
| Integration adapter scope and provider configuration | Relevant file under `1.plugins/<provider-or-system>/` |
| Provider-specific scheduling and invocation | Relevant provider Plugin |

Summaries in other files must link to these authorities rather than restating their full rules.

## Behaviour ownership and integration design

Before adding a new task, Plugin, Add-on or integration workflow, identify the authoritative owner of every behaviour the change requires.

Use this sequence:

1. List the behaviours the new feature needs.
2. Map each behaviour to an existing Core policy or contract where one already owns it.
3. Link to that authority instead of restating its detailed rules.
4. Put only genuinely new provider-neutral behaviour in Core.
5. Put provider-specific configuration, identifiers, scopes and tool mappings in the relevant Plugin.
6. Put scheduling, invocation phrases and provider-specific execution details in the relevant provider Plugin.
7. Do not create a second definition of routing, state-versus-event handling, themes, safety, write authority, source control or persistence behaviour.

A task definition is primarily an orchestration layer. It may define:

- the sequence in which existing rules are applied;
- task-specific eligibility;
- task-specific standing authority;
- task-specific inputs and outputs; and
- task-specific failure or completion conditions.

A task should not copy the detailed semantics of policies it invokes.

A Plugin is primarily an adapter and configuration layer. It may define:

- external-system identifiers and locations;
- approved integration scope;
- provider timestamps and identifiers;
- tool mappings;
- provider-specific eligibility settings;
- provider-owned processed-item or synchronisation state; and
- provider-specific restrictions.

A Plugin must link back to the relevant Core task or policy rather than reproducing its behaviour.

All task and Plugin instructions inherit the Core contract and its safety rules unless the user's explicit current instruction authorises a narrower exception. A lower-level task or Plugin instruction must not accidentally weaken or contradict a higher-level Core rule.

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
