---
name: work-with-second-brain-architecture
description: Work safely and consistently with a repository that uses the portable Second Brain architecture.
---

# Work with the Second Brain architecture

Use this skill when reading, maintaining, extending or integrating a repository built with this Second Brain architecture.

## Goals

- Preserve the three-layer architecture and its portability.
- Keep saved knowledge accurate, traceable and easy to retrieve.
- Keep Core and Add-ons provider-neutral.
- Put provider or external-system integration details only in Plugins.
- Protect private knowledge and prevent personal data leaking into public or derived artefacts.

## Architecture

Treat the repository as three layers:

1. `1.plugins/` contains provider-specific and external-system integration adapters.
2. `2.core/` contains the portable memory model, knowledge, governance, templates and maintenance processes.
3. `3.add-ons/` contains optional provider-neutral skills, interfaces and tooling built on top of Core.

Root `.github/` content is an activation shim required by GitHub, not a fourth architecture layer.

## Before making changes

1. Read the repository `README.md` for orientation.
2. Read `2.core/CONTRACT.md` before changing Core knowledge or governance.
3. Read the relevant layer `CONTRACT.md` before changing Plugins or Add-ons.
4. Identify every behaviour the requested change needs.
5. Map each behaviour to its existing authoritative policy before writing new instructions.
6. Read those authoritative policies and link to them rather than copying their detailed rules.
7. Add new behavioural rules only when no existing authority already owns them.
8. Retrieve only the context needed for the task.

## Working with saved knowledge

- Treat the repository's canonical branch as the durable source of truth.
- Save personal knowledge only after explicit user authorisation.
- Put each mutable fact in one authoritative state location rather than copying it across pages.
- Record dated changes as events when history matters.
- Preserve uncertainty, provenance and transaction lineage when correcting or compacting records.
- Use the immutable UUIDv4 transaction identity defined by `2.core/system/source-control-policy.md`; do not encode dates, providers, projects or operation meaning into transaction IDs.
- Keep `2.core/index.md` aligned with saved knowledge pages.
- Use existing themes where the relationship is clear and maintain reciprocal Markdown links.
- If theme classification is genuinely ambiguous, ask before inventing a classification.
- Propose a new theme rather than silently creating one when a clear new theme emerges.

## Layer routing

### Core

Use Core for memory architecture, knowledge records, maintenance rules, templates and provider-neutral operating guidance.

Do not place AI-provider names, provider-specific APIs, hosting settings or application-specific behaviour in Core.

### Plugins

Use Plugins for integration instructions, provider adapters, hosting configuration and provider-specific discovery metadata.

Keep plugin rules thin. They may adapt Core behaviour but must not redefine Core semantics.

### Add-ons

Use Add-ons for optional provider-neutral tools and reusable skills that depend on the architecture without being required for its basic operation.

Do not make Add-ons an authority for saved personal knowledge or Core operating rules.

## Integration design preflight

Before designing or changing an integration, make a short ownership map.

For each required behaviour, record:

| Behaviour | Authoritative owner | New rule needed? |
| --- | --- | --- |
| Folder or record routing | `2.core/system/directory.md` | Usually no |
| Current state and events | `2.core/system/freshness-policy.md` | Usually no |
| Themes | `2.core/system/theme-and-decision-policy.md` | Usually no |
| Repository writes and commits | `2.core/system/source-control-policy.md` | Usually no |
| General save workflow | `2.core/system/operating-rules.md` | Usually no |
| External folder, IDs, timestamps or scope | Relevant Plugin | Yes, if integration-specific |
| Scheduling or invocation phrases | Relevant provider Plugin | Yes, if provider-specific |
| New task sequencing | Core task definition | Only when genuinely new |

Do not start by writing a complete standalone workflow. Start by composing existing authorities.

A task should normally contain only:

1. eligibility;
2. ordered task-specific steps;
3. task-specific standing authority;
4. outputs and audit requirements; and
5. failure or retry behaviour.

Everything else should be inherited through links to existing policies.

## Privacy and public-release checks

Assume a working Second Brain may contain sensitive personal information.

Before publishing, exporting or generating a public artefact:

- remove personal knowledge records and personal project records;
- clear or sanitise derived memory, indexes, activity logs, source registers and themes that reveal private facts;
- remove hard-coded private repository identifiers and user-specific integration instructions;
- ensure generated browser, graph, search or cache artefacts do not contain copies of private knowledge;
- keep generated private-data artefacts out of version control where practical;
- check the Git history separately, because deleting data from the current tree does not remove it from earlier commits.

Prefer a fresh Git history for a genuinely public distribution when the source repository has previously contained private data.

## Change workflow

1. Classify the request as Core, Plugin, Add-on or repository-level work.
2. Read the governing contract and policies.
3. Inspect the current files before editing.
4. Make the smallest coherent change that fulfils the request.
5. Update related indexes, references, generated artefacts or validation rules when required.
6. Check for broken links, duplicated state, duplicated behavioural policy, conflicting instructions, provider leakage and accidental personal data exposure.
7. Run the repository validation relevant to the changed layer.
8. Commit using the repository's source-control policy or an explicit user override.
9. Report what changed and any remaining limitation clearly.

## Validation

For repository-wide structural checks, run:

```bash
python 2.core/scripts/check_second_brain.py
```

For the browser explorer, regenerate or test its data only as required by its own README and workflow. Generated data must not become a second authoritative store.

## Important boundaries

- Do not infer permission to save from a discussion alone.
- Do not rewrite historical events merely because current state changes.
- Do not duplicate mutable facts for convenience.
- Do not place provider-specific behaviour in Core or Add-ons.
- Do not treat generated views, caches or browser data as canonical knowledge.
- Do not publish a branch containing current-tree redactions while claiming its inherited Git history is free of the removed information.
- Do not duplicate behavioural policy for convenience. Link to its authoritative owner.
- Do not make a task definition self-contained by copying routing, theme, freshness, safety or source-control rules.
- Do not make a Plugin self-contained by copying Core semantics.
- When a lower-level task appears to conflict with Core, Core remains authoritative unless the user's explicit current instruction clearly overrides it.
