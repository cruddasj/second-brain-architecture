# Add-on contract

Add-ons provide optional functionality above Core. They are not required to read, write or validate the canonical second brain.

## Portability requirements

- Add-ons must not require a named AI provider, hosting provider, model, proprietary memory service or provider-specific record field.
- Add-on code, instructions, examples, tests, manifests, generated formats and documentation must not prescribe or assume a named AI provider, AI product, model family, API, SDK, tool name, instruction-file convention or managed memory service.
- Provider-specific connection, authentication, deployment and tool mapping belongs under `1.plugins/`.
- An add-on may consume stable Core formats or a neutral interface exposed by a plugin, but its basic operation cannot depend on one provider adapter.
- Removing or replacing an add-on must not invalidate Core knowledge, policies or templates.
- Removing a plugin must not corrupt an add-on's stored data.
- Add-ons cannot weaken the Core write gate, source controls, safety rules or canonical-branch semantics.
- Secrets and credentials are never committed.

Provider-specific compatibility notes and research also belong in the matching plugin. A change to an add-on is incomplete until portability validation passes and the diff has been checked for provider-specific paths, names and assumptions.

Each add-on has a README and, where dedicated agent guidance is useful, an `AGENTS.md` entry point. Both point to shared contracts rather than duplicating normative rules.

## Change control

Any logical change that touches a path under `3.add-ons/` uses a topic branch and pull request by default. This also applies to mixed changes that include an add-on path. Follow the authoritative write-route rules in [Core's source-control policy](../2.core/system/source-control-policy.md); the user's current explicit instruction may override the default for a particular change.
