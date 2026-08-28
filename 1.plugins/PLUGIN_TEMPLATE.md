<!-- Required plugin README structure. For every plugin, copy this file to `1.plugins/<provider-or-system>/README.md`, replace the instructional text with plugin-specific content, and preserve the H1/H2 structure and section order exactly. Do not add, remove, rename or reorder template sections in a plugin README. Put extra detail inside the existing sections or in linked supporting files. -->

# Plugin name

- Plugin ID: `<lowercase UUIDv4 registered in ../plugin-registry.json>`

## Purpose

Describe the external provider, platform or system this Plugin adapts.

This Plugin is optional and does not redefine Core behaviour.

## Core authority

- Core contract: `2.core/CONTRACT.md`
- Core task or workflow:
- Relevant Core policies:

The Plugin inherits these rules rather than copying them.

## Approved scope

Describe exactly what this Plugin is authorised to access or operate on.

Include where relevant:

- account or connection;
- folder, repository, project or resource;
- start date or cutoff;
- permitted item types;
- approved purpose.

## Provider configuration

Record only provider-specific configuration needed by the integration.

Examples:

- provider resource IDs;
- provider timestamps;
- folder or repository identifiers;
- provider-specific query fields;
- stable deduplication identifiers.

When this Plugin can provide Core source material, document how
`Plugin provider resource ID` maps to the provider's resource field and how
an authorised operator resolves it. Keep the provider name, native field label,
resource URL construction and lookup steps here rather than in Core.

Do not store secrets, credentials or live tokens.

## Tool mapping

| Core operation | Provider action |
| --- | --- |
| Discover eligible items | |
| Read item content | |
| | |

## Allowed actions

- 

## Prohibited actions

- 

## Provider-owned state

Describe any processed-item register, cursor, synchronisation checkpoint or other provider-specific state.

State the stable deduplication key where relevant.

## Failure behaviour

Describe only provider-specific failures or retry behaviour.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Describe what happens if this Plugin is removed.

Removing the Plugin must not invalidate Core or alter the meaning of saved knowledge.
