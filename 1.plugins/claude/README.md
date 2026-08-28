# Claude plugin

- Plugin ID: `30291738-f1c0-4f2d-b2f2-aa4c099cf4f9`

## Purpose

This Plugin adapts Core to Claude Code as a local-checkout coding-agent environment. Unlike a connected-repository adapter, Claude Code can work directly with files, shell commands and Git state in an authorised checkout.

This gives the public scaffold a materially different Plugin shape for testing the Plugin/Core boundary rather than assuming every AI integration behaves like a repository connector.

This Plugin is optional and does not redefine Core behaviour.

## Core authority

- Core contract: [`../../2.core/CONTRACT.md`](../../2.core/CONTRACT.md)
- Core task or workflow: whichever authorised Core task the current request invokes
- Relevant Core policies: [`../../2.core/system/operating-rules.md`](../../2.core/system/operating-rules.md) and [`../../2.core/system/source-control-policy.md`](../../2.core/system/source-control-policy.md)

The Plugin inherits these rules rather than copying them. Core owns canonical persistence, validation, routing, safety, save completion and write-route semantics.

## Approved scope

This public scaffold grants no access to any account, local checkout, repository or external resource.

Before use, configure [project-instructions.md](project-instructions.md) with the checkout, remote, default branch and file, shell and Git operations authorised for the intended task.

The Plugin applies only to that configured environment. Local filesystem access or shell capability does not create authority to read or write outside the approved scope.

## Provider configuration

[project-instructions.md](project-instructions.md) is the template adapter for the configured Claude Code environment.


Claude Code currently reads project-level `CLAUDE.md` instructions rather than automatically loading `AGENTS.md`. Anthropic's current documentation recommends a `CLAUDE.md` file that imports `AGENTS.md`; native `AGENTS.md` support remains tracked upstream in [`anthropics/claude-code#6235`](https://github.com/anthropics/claude-code/issues/6235).

The public architecture deliberately does **not** include a root `CLAUDE.md` file. Adding one is an optional private-repository setup choice because it introduces Claude-specific content at repository root.

If a user wants Claude Code to load the existing provider-neutral `AGENTS.md` entry point automatically, follow [SETUP.md](SETUP.md). Before creating the root file, explicitly tell the user that:

- `CLAUDE.md` will be added at repository root;
- the file is specific to Claude Code;
- its only proposed content is `@AGENTS.md`; and
- accepting it is a deliberate exception to keeping the private repository root provider-neutral.

Create and register that shim only after the user explicitly accepts those points. If the user declines, leave the root unchanged and direct Claude Code to read `AGENTS.md` explicitly when needed.

Reference: [Claude Code project memory documentation](https://code.claude.com/docs/en/memory).

Provider-specific MCP, permission or execution settings may be recorded in this Plugin when required. Provider-neutral reusable skills remain under `3.add-ons/skills/`.

Do not store secrets, credentials or live tokens in this Plugin.

If this Plugin supplies source material to Core, its local adapter must define
how `Plugin provider resource ID` maps to the configured resource. Core must
not receive provider field labels, resource paths that reveal provider
configuration or account details.

## Tool mapping

| Core operation | Provider action |
| --- | --- |
| Load canonical repository context | Use Git to fetch and inspect the configured remote default branch before relying on the local checkout as current repository state |
| Read repository content | Read files from the authorised checkout |
| Invoke an authorised Core task | Use Claude Code file, search, shell and Git tools to carry out that Core task |
| Persist a change using the Core-selected write route | Use authorised Git commands and, when configured, the available hosting or change-proposal mechanism selected by Core |
| Validate proposed repository changes | Run the repository's required validation commands before reporting a write complete |
| Report the task outcome | Return the provider-facing result without redefining Core completion semantics |

## Allowed actions

- Read and edit files inside the configured checkout when authorised by Core and the current request.
- Run approved shell, validation and Git commands within the configured scope.
- Use configured MCP tools when separately authorised and when they do not bypass Core's write-authority rules.
- Use the provider-specific change mechanism selected by Core when it is configured and authorised.
- Provide Claude-specific invocation, permission and compatibility guidance when needed.
- After explicit user acceptance, create the documented root compatibility shim in a private Second Brain and register it for validation.

These capabilities do not create independent write authority.

## Prohibited actions

- Redefine Core routing, persistence, validation, safety, write authority or completion semantics.
- Create or register a root `CLAUDE.md` file without the user's explicit acceptance of the provider-specific root exception.
- Treat the local working tree, any accepted `CLAUDE.md` shim, Claude-managed memory or conversation state as canonical Second Brain state.
- Assume an unfetched or divergent local checkout is the current canonical repository state.
- Access or modify files, repositories or external resources outside the configured scope merely because local or shell access is available.
- Store secrets, credentials or live tokens in repository files.

## Provider-owned state

Local checkout state, current branches, uncommitted edits and Claude Code session or memory data remain outside Core's canonical knowledge model.

The public architecture contains no committed Claude root shim. In a private Second Brain where the user explicitly accepts one, `CLAUDE.md` must remain only the compatibility pointer documented in [SETUP.md](SETUP.md) and must be registered in `1.plugins/root-shims.json`.

User-level or local Claude configuration remains outside the repository unless a provider-specific setting is deliberately approved for sharing. This Plugin requires no processed-item or synchronisation register by default.

## Failure behaviour

Surface local-checkout, permission, shell, Git, MCP or hosting-tool failures to the invoking Core operation. Core determines whether the task is complete, should be retried or requires user action.

If the configured checkout cannot be reconciled safely with the canonical remote state, stop rather than guessing or overwriting competing changes.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin disables the Claude Code adapter and removes Claude-specific configuration committed under this Plugin.

If a private Second Brain previously opted in to the root `CLAUDE.md` shim, its removal is a separate root-level change and should be handled under the repository's normal change authority rather than assumed automatically.

Core, Add-ons and saved knowledge must remain valid and meaningful without this Plugin.
