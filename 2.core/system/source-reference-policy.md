---
title: Provider-neutral source reference policy
type: system
updated: 2026-08-28
---

# Provider-neutral source reference policy

This policy defines how Core identifies source material without depending on
the provider or external system used to retrieve it.

## Reference forms

Every source note uses one of these forms:

| Source kind | Core fields | Use |
| --- | --- | --- |
| `direct` | `Original source` | The source can be identified without a Plugin |
| `plugin` | `Plugin ID` and `Plugin provider resource ID` | A Plugin is required to resolve or retrieve the source |

For a Plugin-backed source:

- `Plugin ID` is the lowercase UUIDv4 registered in
  [`1.plugins/plugin-registry.json`](../../1.plugins/plugin-registry.json).
- `Plugin provider resource ID` is the stable opaque resource identifier
  returned by that Plugin.
- The pair of values identifies the external resource. Neither value gives
  Core permission to retrieve it.

Core must not store the provider name, a provider-specific field label,
account details, a provider resource URL or provider resolution instructions
for a Plugin-backed source. Those details belong in the registered Plugin.

## Capture and resolution

At capture time, the Plugin translates its provider-specific metadata into the
two Core fields. It must use the most stable resource identifier available and
must not place credentials, access tokens or user-specific account details in
Core.

At resolution time, an operator looks up the `Plugin ID` in the Plugin
registry, then follows that Plugin's configuration to interpret the
`Plugin provider resource ID`. Core treats both values as opaque and does not
infer a provider or retrieval method from them.

If the Plugin is absent, disabled or no longer authorised, the source note
remains valid evidence metadata but the external resource is unresolved.
Removing a Plugin must not alter the meaning of the summary, claims or limits
already recorded in Core.

## Direct sources

Use `Original source` only when no Plugin is needed to interpret the locator.
A direct locator may be a public URL, citation or provider-neutral local
reference. Do not copy a Plugin-owned resource URL into this field to avoid the
Plugin reference form.

## Privacy and portability

Record only the minimum identifier needed to resolve the source. Keep display
names, account identifiers, folder paths and other provider-owned context in
the Plugin when they are required. The source note may retain ordinary
bibliographic facts such as title, author, organisation and publication date
when they describe the source itself rather than its provider.
