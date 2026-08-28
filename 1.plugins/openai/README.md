# OpenAI plugin

- Plugin ID: `9450ddf6-2dfe-4e3a-880d-283435da5204`

## Purpose

This Plugin adapts Core to an OpenAI connection environment. It provides OpenAI-specific connection and invocation guidance and may hold provider-specific discovery metadata when an integration requires it.

This Plugin is optional and does not redefine Core behaviour.

## Core authority

- Core contract: [`../../2.core/CONTRACT.md`](../../2.core/CONTRACT.md)
- Core task or workflow: whichever authorised Core task the current request invokes
- Relevant Core policies: [`../../2.core/system/operating-rules.md`](../../2.core/system/operating-rules.md) and [`../../2.core/system/source-control-policy.md`](../../2.core/system/source-control-policy.md)

The Plugin inherits these rules rather than copying them. Core owns canonical persistence, validation, routing, safety, save completion and failure semantics.

## Approved scope

This public scaffold grants no access to any OpenAI account, connected repository or external resource.

Before use, configure [project-instructions.md](project-instructions.md) for the repository selected to hold the Second Brain and authorise the connection and tools required for the intended task. The Plugin applies only to that configured connection and provider-specific invocation behaviour.

## Provider configuration

[project-instructions.md](project-instructions.md) is the template adapter for the configured OpenAI connection and repository placeholder.


Provider-specific discovery metadata may be added under this Plugin only when an integration actually requires it. Provider-neutral reusable skills remain under `3.add-ons/skills/`.

If this Plugin supplies source material to Core, its provider-specific
discovery adapter must define how `Plugin provider resource ID` maps to the
connected resource identifier. Core must not receive provider field labels,
resource URLs or account details.

Do not store secrets, credentials or live tokens in this Plugin.

## Tool mapping

| Core operation | Provider action |
| --- | --- |
| Load canonical repository context | Use the configured connected-repository access available through the OpenAI environment |
| Invoke an authorised Core task | Use the available OpenAI conversation and tool mechanisms to run that Core task |
| Report the task outcome | Return the provider-facing result without redefining Core completion semantics |

## Allowed actions

- Use the configured OpenAI connection and tools for tasks already authorised by Core and the current request.
- Read the configured repository when permitted by the connection and current task authority.
- Provide OpenAI-specific invocation guidance and discovery metadata when needed.

These capabilities do not create independent write authority.

## Prohibited actions

- Redefine Core routing, persistence, validation, safety, write authority or completion semantics.
- Treat OpenAI-specific state or provider-managed memory as authority that overrides Core.
- Access or modify resources outside the configured scope merely because this Plugin is present.
- Store secrets, credentials or live tokens in repository files.

## Provider-owned state

This public scaffold requires no provider-owned synchronisation register or processed-item state.

OpenAI connection settings and other live provider state remain outside Core. Any provider-specific metadata that must be committed belongs under this Plugin and must not be copied into Core unless it becomes genuinely provider-neutral architecture knowledge.

## Failure behaviour

Surface OpenAI connection, tool or provider-access failures to the invoking Core operation. Core determines whether the task is complete, should be retried or requires user action.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin disables the OpenAI-specific connection adapter and provider metadata.

Core, Add-ons and saved knowledge must remain valid and meaningful without this Plugin.
