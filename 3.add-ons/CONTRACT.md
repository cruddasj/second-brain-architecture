# Add-on contract

Add-ons provide optional functionality above Core. They are not required to read, write or validate the canonical second brain.

## Portability model

Portability has three separate concerns. Do not treat a shared packaging convention as if it were provider-specific workflow behaviour.

### Provider-neutral workflow content

- Add-on behaviour, code, instructions, examples, tests, generated formats and documentation must not require or assume a named AI provider, hosting provider, model, proprietary memory service, provider-specific API, SDK, tool action, record field or integration path.
- An Add-on may consume stable Core formats or a provider-neutral interface exposed by a Plugin. Core's documented read-only Markdown interface is [`2.core/scripts/record_text.py`](../2.core/CONTRACT.md#shared-core-interfaces); an Add-on may use its listed functions while preserving this contract. An Add-on cannot depend on one provider adapter.
- When portable Add-on content must identify a specific optional Plugin without importing its provider identity, use the immutable Plugin UUID from `1.plugins/plugin-registry.json` as defined by `1.plugins/CONTRACT.md`.
- A Plugin UUID reference identifies an optional adapter contract only. It does not grant access, widen capabilities, authorise a write or make that Plugin required for the Add-on's basic operation.

### Cross-provider packaging conventions

The architecture may define fixed filenames, folder shapes or metadata schemas for portable packaging when their meaning is owned by this repository rather than by one provider.

Examples include:

- `README.md` for human-facing documentation;
- `AGENTS.md` for the architecture's shared agent entry points;
- `SKILL.md` for a generic reusable workflow definition; and
- `manifest.json` for the generic skill package metadata defined by the skills contract.

These conventions are permitted in Add-ons even when several external tools can recognise the same filename. Their contents and schema must remain provider-neutral, and they must not contain provider-specific discovery, installation, activation, authentication or execution metadata.

### Provider-specific discovery and installation

- Any filename, folder, manifest field, activation rule, installation layout, connection detail, deployment setting or tool mapping required only by a named provider belongs under the matching Plugin in `1.plugins/`.
- Provider-specific skill discovery or installation packaging belongs under `1.plugins/<plugin>/skills/<name>/` and may point back to the generic Add-on catalogue source rather than duplicating its workflow semantics.
- Provider-specific root activation shims follow `1.plugins/CONTRACT.md` and `1.plugins/root-shims.json`; they are not Add-on packaging.
- Provider-specific compatibility notes and research also belong in the matching Plugin.

## Common requirements

- Removing or replacing an Add-on must not invalidate Core knowledge, policies or templates.
- Removing a Plugin must not corrupt an Add-on's stored data.
- Add-ons cannot weaken the Core write gate, source controls, safety rules or canonical-branch semantics.
- Secrets and credentials are never committed.
- A change to an Add-on is incomplete until portability validation passes and the diff has been checked for provider-specific paths, names and assumptions.

Each Add-on has a README and, where dedicated agent guidance is useful, an `AGENTS.md` entry point. Both are architecture-owned packaging conventions and point to shared contracts rather than duplicating normative rules.

## Change control

Any logical change that touches a path under `3.add-ons/` uses a topic branch and pull request by default. This also applies to mixed changes that include an Add-on path. Follow the authoritative write-route rules in [Core's source-control policy](../2.core/system/source-control-policy.md); the user's current explicit instruction may override the default for a particular change.
