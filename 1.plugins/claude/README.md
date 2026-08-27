# Claude plugin

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

The repository therefore includes a root `CLAUDE.md` compatibility shim containing only `@AGENTS.md`. It imports the existing provider-neutral agent entry point and contains no independent operating rules. If native `AGENTS.md` discovery makes the shim unnecessary, it can be removed with this Plugin without changing Core.

Reference: [Claude Code project memory documentation](https://code.claude.com/docs/en/memory).

Provider-specific MCP, permission or execution settings may be recorded in this Plugin when required. Provider-neutral reusable skills remain under `3.add-ons/skills/`.

Do not store secrets, credentials or live tokens in this Plugin.

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

These capabilities do not create independent write authority.

## Prohibited actions

- Redefine Core routing, persistence, validation, safety, write authority or completion semantics.
- Treat the local working tree, `CLAUDE.md`, Claude-managed memory or conversation state as canonical Second Brain state.
- Assume an unfetched or divergent local checkout is the current canonical repository state.
- Access or modify files, repositories or external resources outside the configured scope merely because local or shell access is available.
- Store secrets, credentials or live tokens in repository files.

## Provider-owned state

Local checkout state, current branches, uncommitted edits and Claude Code session or memory data remain outside Core's canonical knowledge model.

The committed root `CLAUDE.md` is only the compatibility shim described above. User-level or local Claude configuration remains outside the repository unless a provider-specific setting is deliberately approved for sharing.

This Plugin requires no processed-item or synchronisation register by default.

## Failure behaviour

Surface local-checkout, permission, shell, Git, MCP or hosting-tool failures to the invoking Core operation. Core determines whether the task is complete, should be retried or requires user action.

If the configured checkout cannot be reconciled safely with the canonical remote state, stop rather than guessing or overwriting competing changes.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin disables the Claude Code adapter and removes the root `CLAUDE.md` compatibility shim and any Claude-specific configuration committed under this Plugin.

Core, Add-ons and saved knowledge must remain valid and meaningful without this Plugin.
