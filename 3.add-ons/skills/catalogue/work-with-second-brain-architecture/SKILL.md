---
name: work-with-second-brain-architecture
description: Work safely and consistently with a repository that uses the portable Second Brain architecture.
---

# Work with the Second Brain architecture

Use this skill to read, maintain or extend a repository built with this architecture. The repository owns operating semantics; this skill locates them.

## Start

1. Read the target repository's `AGENTS.md` and follow it to `2.core/CONTRACT.md`.
2. Select the contract's task-context route. Load only the applicable sections and required references. Follow its version checks when reusing instructions already in context.
3. Before using an integration, read its Plugin `AGENTS.md` and `README.md`. Use only capabilities available in the current environment and documented by that Plugin.
4. For changes under `1.plugins/` or `3.add-ons/`, read the relevant layer entry point and contract. For skill authoring, also read `3.add-ons/skills/CONTRACT.md`.
5. For publishing or exporting, load `2.core/system/public-release-policy.md` before preparing the public artefact.

Paths above are relative to the target repository, not to an installed copy of this skill. If the repository or required context is unavailable, obtain it through the authorised integration or ask for the missing material. Do not reconstruct policies from memory.

## Capability checks

A connected repository, local checkout and conversation-only adapter expose different capabilities. Confirm the current adapter can supply the required files, validation and persistence evidence. Missing, stale or truncated context blocks the affected operation until resolved.

Resolve optional Plugin identities through `1.plugins/plugin-registry.json`; the selected Plugin owns provider-specific setup and resource lookup. Do not invent source identifiers from temporary conversation context.

## Completion

For an authorised change, follow Core's save workflow, validation and source-control route. Report only the state supported by evidence, including whether the change is proposed or canonical. This skill does not grant save, installation, adoption or publication authority.
