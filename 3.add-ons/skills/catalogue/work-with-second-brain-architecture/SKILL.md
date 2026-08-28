---
name: work-with-second-brain-architecture
description: Work safely and consistently with a repository that uses the portable Second Brain architecture.
---

# Work with the Second Brain architecture

Use this skill when reading, maintaining, extending or integrating a repository built with this Second Brain architecture.

## Goals

- Preserve the three-layer architecture and its portability.
- Keep saved knowledge accurate, traceable and easy to retrieve.
- Keep architecture, governance and Add-ons provider-neutral.
- Put provider or external-system integration details only in Plugins.
- Respect the capabilities and limits of the selected Plugin rather than assuming repository, file, shell or external-resource access.
- Protect private knowledge and prevent personal data leaking into public or derived artefacts.

## Architecture

Treat the repository as three layers:

1. `1.plugins/` contains provider-specific and external-system integration adapters.
2. `2.core/` contains the portable memory model, canonical knowledge, governance, templates and maintenance processes.
3. `3.add-ons/` contains optional provider-neutral skills, interfaces and tooling built on top of Core.

Platform-required root files are activation shims, not a fourth architecture layer. Keep provider-specific root shims thin, explicitly authorised and registered as required by `1.plugins/CONTRACT.md`. Root `.github/` content is the bundled GitHub example.

## Before making changes

1. Read the repository `AGENTS.md` entry point when present and follow its links before doing anything else. In this architecture it routes to `2.core/AGENTS.md` and `2.core/CONTRACT.md`.
2. Read the repository `README.md` for orientation.
3. Read the relevant layer `AGENTS.md` and `CONTRACT.md` before changing Plugins or Add-ons.
4. When using a Plugin, read that Plugin's `AGENTS.md` and `README.md` before relying on its capabilities or configuration.
5. Before any write, read `2.core/system/operating-rules.md`, `2.core/system/freshness-policy.md`, `2.core/system/source-control-policy.md` and the destination file immediately before editing.
6. Identify every behaviour the requested change needs.
7. Map each behaviour to its existing authoritative policy before writing new instructions.
8. Read those authoritative policies and link to them rather than copying their detailed rules.
9. Add new behavioural rules only when no existing authority already owns them.
10. Retrieve only the context needed for the task.

## Working with saved knowledge

- Treat only the configured remote default branch as canonical remembered state unless the user explicitly asks about proposed work.
- Treat conversations, local edits, topic branches and open pull requests as non-canonical.
- Save personal knowledge only after explicit user authorisation.
- Put each mutable fact in one authoritative state location rather than copying it across pages.
- Record dated changes as events when history matters.
- Preserve uncertainty, provenance and transaction lineage when correcting or compacting records.
- Use the immutable UUIDv4 transaction identity defined by `2.core/system/source-control-policy.md`; do not encode dates, providers, projects or operation meaning into transaction IDs.
- Keep `2.core/index.md` aligned with saved knowledge pages when navigation changes.
- Use existing themes where the relationship is clear and maintain reciprocal Markdown links.
- If theme classification is genuinely ambiguous, ask before inventing a classification.
- Propose a new theme rather than silently creating one when a clear new theme emerges.

## Source references

Follow `2.core/system/source-reference-policy.md` whenever Core records source material.

- Use a `direct` source only when the source has a durable locator or citation that can be interpreted without a Plugin.
- For a Plugin-backed source, Core stores only the Plugin UUID from `1.plugins/plugin-registry.json` and the opaque `Plugin provider resource ID` supplied by that Plugin.
- Keep provider names, provider-specific field labels, resource URLs, account details and resolution instructions in the registered Plugin rather than Core.
- A Plugin ID identifies the adapter contract, not an account, installation or credential.
- Do not invent a source identifier from a conversation turn, pasted filename, temporary path or other value that the selected Plugin cannot resolve later.
- If a conversation-only adapter cannot provide a stable Plugin-backed reference, record relayed material as `direct` only when an independent durable locator exists; otherwise do not create a source reference.

## Layer routing

### Core

Use Core for the portable memory architecture, canonical knowledge records, maintenance rules, templates and provider-neutral operating guidance.

Keep Core architecture, governance, templates and operating behaviour independent of named providers. Saved knowledge may name a provider, product or external system when it is itself the subject of the knowledge; provider-specific setup, tool mappings, integration configuration, resource resolution and instruction-file conventions still belong in Plugins.

### Plugins

Use Plugins for integration instructions, provider adapters, hosting configuration, provider-specific discovery metadata and provider-owned state.

Keep Plugin rules thin. They may adapt Core behaviour but must not redefine Core semantics.

Each Plugin has one immutable lowercase UUIDv4 in `1.plugins/plugin-registry.json`. When it can supply sources to Core, the Plugin owns the mapping from Core's opaque resource ID to the provider's native lookup field, URL construction and retrieval process.

Do not assume every Plugin can read files, use a shell, modify source control or reach external resources. Use only capabilities that the selected Plugin explicitly documents.

### Add-ons

Use Add-ons for optional provider-neutral tools and reusable skills that depend on the architecture without being required for its basic operation.

Do not make Add-ons an authority for saved personal knowledge or Core operating rules. Keep Add-on definitions, manifests, examples, tests and documentation free of provider-specific execution assumptions. Follow `3.add-ons/skills/CONTRACT.md` for skill authoring and lifecycle behaviour.

## Integration design preflight

Before designing or changing an integration, make a short ownership map.

For each required behaviour, record:

| Behaviour | Authoritative owner | New rule needed? |
| --- | --- | --- |
| Folder or record routing | `2.core/system/directory.md` | Usually no |
| Current state and events | `2.core/system/freshness-policy.md` | Usually no |
| Themes | `2.core/system/theme-and-decision-policy.md` | Usually no |
| Repository writes, canonical status and transaction IDs | `2.core/system/source-control-policy.md` | Usually no |
| General save workflow | `2.core/system/operating-rules.md` | Usually no |
| Source reference form | `2.core/system/source-reference-policy.md` | Usually no |
| Plugin identity and source resolution mapping | `1.plugins/CONTRACT.md` and `1.plugins/plugin-registry.json` | Only when integration-specific |
| External folder, IDs, timestamps, scope or capability mapping | Relevant Plugin | Yes, if integration-specific |
| Scheduling or invocation phrases | Relevant provider Plugin | Yes, if provider-specific |
| Provider-specific root activation shim | Relevant Plugin and `1.plugins/root-shims.json` | Only after explicit acceptance |
| Skill lifecycle and reusable-skill authoring | `3.add-ons/skills/CONTRACT.md` | Usually no |
| New task sequencing | Core task definition | Only when genuinely new |

Do not start by writing a complete standalone workflow. Start by composing existing authorities.

A task should normally contain only:

1. eligibility;
2. ordered task-specific steps;
3. task-specific standing authority;
4. outputs and audit requirements; and
5. failure or retry behaviour.

Everything else should be inherited through links to existing policies.

## Capability-aware operation

Treat Plugin documentation as the authority for what the current integration can actually do.

- A connected-repository adapter may be able to read or write a configured remote repository without local file or shell access.
- A local-checkout adapter may expose files, shell commands and Git state in an authorised checkout.
- A conversation-only adapter may receive only text deliberately supplied by a person and may require that person to apply, validate and persist proposed changes.
- Never claim a change is validated, committed, canonical, remembered or retrievable unless the available integration provides evidence for that state.
- If required context is missing, stale, truncated or contradictory, stop the affected operation and obtain the current authoritative material rather than filling gaps by inference.

These are capability shapes, not provider-specific requirements. The selected Plugin defines the actual mapping.

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
2. Follow the applicable `AGENTS.md` entry points, contracts and policies.
3. Inspect the current files before editing and re-read each destination immediately before writing.
4. Assign the UUIDv4 transaction ID required by the source-control policy for an authorised repository change.
5. Make the smallest coherent change that fulfils the request.
6. Update related indexes, references, generated artefacts or validation rules only when the governing authority requires it.
7. Check for broken links, duplicated state, duplicated behavioural policy, conflicting instructions, provider leakage from portable architecture paths and accidental personal data exposure.
8. Run the repository validation relevant to the changed layer.
9. Persist using the source-control route selected by Core. A change under `3.add-ons/` uses a topic branch and pull request by default.
10. Report the transaction UUID, proposal or canonical status, commit receipt and exact files changed as required by the source-control policy.

## Validation

For repository-wide structural checks, run:

```bash
python 2.core/scripts/check_second_brain.py
```

The portability validator protects provider-neutral architecture and Add-on paths. Do not misread that rule as a ban on ordinary saved knowledge mentioning a provider when the provider is genuinely the subject of that knowledge.

For the browser explorer, regenerate or test its data only as required by its own README and workflow. Generated data must not become a second authoritative store.

## Important boundaries

- Do not infer permission to save from a discussion alone.
- Do not treat a branch, pull request, conversation or local checkout as remembered canonical state.
- Do not rewrite historical events merely because current state changes.
- Do not duplicate mutable facts for convenience.
- Do not place provider-specific operating behaviour or integration configuration in Core or Add-ons.
- Do not reject legitimate saved knowledge merely because it mentions a provider or product as its subject.
- Do not treat generated views, caches or browser data as canonical knowledge.
- Do not publish a branch containing current-tree redactions while claiming its inherited Git history is free of the removed information.
- Do not duplicate behavioural policy for convenience. Link to its authoritative owner.
- Do not make a task definition self-contained by copying routing, theme, freshness, safety, source-reference or source-control rules.
- Do not make a Plugin self-contained by copying Core semantics.
- Do not invent Plugin-backed source IDs from temporary conversation or file context.
- Do not assume an integration capability that its Plugin does not document.
- When a lower-level task appears to conflict with Core, Core remains authoritative unless the user's explicit current instruction clearly overrides it.
