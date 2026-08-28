# Manual chat plugin

- Plugin ID: `0aeb11e2-53c7-4766-b3d9-8d60e482c8cc`

## Purpose

This Plugin adapts Core to a conversation-only AI interface with no connector, file, shell or source-control access. A person supplies the required repository text and applies any reviewed changes manually.

This Plugin is optional and does not redefine Core behaviour.

## Core authority

- Core contract: [`../../2.core/CONTRACT.md`](../../2.core/CONTRACT.md)
- Core task or workflow: whichever authorised Core task the current request invokes
- Relevant Core policies: [`../../2.core/system/operating-rules.md`](../../2.core/system/operating-rules.md) and [`../../2.core/system/source-control-policy.md`](../../2.core/system/source-control-policy.md)

The Plugin inherits these rules rather than copying them. Core owns routing, safety, write authority, validation, persistence and completion semantics.

## Approved scope

This public scaffold grants no access to a repository, account, local file or external resource.

The Plugin may use only the repository text that a person deliberately supplies in the current conversation. The person remains responsible for deciding what to share, applying any proposed change and running the required repository checks.

## Provider configuration

No provider configuration is required.

At the start of a task, the person supplies `AGENTS.md`, `2.core/CONTRACT.md`, the relevant layer contract and the files needed for the requested operation. If the task may produce a change, they also supply the relevant Core policies and current destination files.

This Plugin must not identify a Plugin-backed source under the [source reference policy](../../2.core/system/source-reference-policy.md). Pasted text has no stable provider resource that this Plugin can resolve later, so it cannot supply a valid `Plugin provider resource ID`. Record relayed source material as a `direct` source only when it has a durable locator or citation that identifies it independently of this Plugin; otherwise do not create a source reference. Never invent an identifier from a conversation turn, message or pasted filename.

Do not paste secrets, credentials, live tokens or unrelated private knowledge into the conversation.

## Tool mapping

| Core operation | Provider action |
| --- | --- |
| Load canonical repository context | The person copies the required current files from the canonical repository into the conversation |
| Read repository content | The AI reads only the text supplied in the conversation |
| Prepare an authorised change | The AI returns a reviewable replacement, patch or exact edit instructions |
| Apply the reviewed change | The person applies the accepted edit through their normal repository workflow |
| Validate proposed repository changes | The person runs the repository's required checks and reports any failures for review |
| Persist using the Core-selected write route | The person commits, pushes or proposes the validated change as required by Core |

## Allowed actions

- Analyse repository text deliberately supplied for the current task.
- Ask for a missing file or section when the supplied context is not enough.
- Produce a reviewable proposed change after the current request authorises one.
- Explain which validation and persistence steps the person must perform.

These capabilities do not create independent write authority.

## Prohibited actions

- Claim direct access to files, connectors, shell commands, source control or external resources.
- Treat conversation state as canonical repository state.
- Infer missing repository content or claim a change is validated, committed or remembered without evidence from the person.
- Redefine Core routing, persistence, validation, safety, write authority or completion semantics.
- Ask the person to share secrets, credentials, live tokens or unrelated private knowledge.

## Provider-owned state

The conversation may temporarily contain the files and proposed edits supplied for the current task. That conversation state is not canonical and must not override repository content.

This Plugin requires no processed-item register, cursor or synchronisation checkpoint.

## Failure behaviour

If required context is missing, stale, truncated or contradictory, stop the affected operation and ask the person for the exact current file or section needed.

If a manual edit, validation command or persistence step fails, report the failure without claiming that the Core operation completed. The person can then supply the error or current file for another review.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin removes only the manual conversation adapter.

Core, Add-ons and saved knowledge remain valid and meaningful without this Plugin.
