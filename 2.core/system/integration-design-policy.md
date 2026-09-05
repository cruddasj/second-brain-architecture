---
title: Integration design policy
type: system
updated: 2026-09-05
---

# Integration design policy

Before adding a new task, Plugin, Add-on or integration workflow, identify the authoritative owner of every behaviour the change requires.

Use this sequence:

1. List the behaviours the new feature needs.
2. Map each behaviour to an existing Core policy or contract where one already owns it.
3. Link to that authority instead of restating its detailed rules.
4. Put only genuinely new provider-neutral behaviour in Core.
5. Put provider-specific configuration, identifiers, scopes and tool mappings in the relevant Plugin.
6. Put scheduling, invocation phrases and provider-specific execution details in the relevant provider Plugin.
7. Do not create a second definition of routing, state-versus-event handling, record relationships, themes, safety, write authority, source control or persistence behaviour.

A task definition is primarily an orchestration layer. It may define:

- the sequence in which existing rules are applied;
- task-specific eligibility;
- task-specific limits for separately granted standing authority;
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

When Core records a source reached through a Plugin, it stores only the
Plugin's registered UUID and the provider resource identifier under
provider-neutral field names. Provider names, provider-specific labels,
resource URLs and resolution rules stay in the Plugins layer. The
[source reference policy](source-reference-policy.md) defines this
boundary.

A Plugin must link back to the relevant Core task or policy rather than reproducing its behaviour.

All task and Plugin instructions inherit the Core contract and its safety rules unless the user's explicit current instruction authorises a narrower exception. A lower-level task or Plugin instruction must not accidentally weaken or contradict a higher-level Core rule.
