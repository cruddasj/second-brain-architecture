# Plugin contract

Plugins adapt the portable second brain to a named provider, platform or external system.

For AI agentic use, start with [AGENTS.md](AGENTS.md), follow the [Core contract](../2.core/CONTRACT.md), then read the selected plugin's AGENTS and README files.

## Boundaries

A plugin may contain setup guidance, tool mappings, provider metadata and historical integration records.

Every plugin must:

- remain optional and self-contained;
- point to the Core contract;
- leave Core usable when removed;
- keep provider-specific material under `1.plugins/<provider-or-system>/`, except for a documented platform-required root shim; and
- contain no secrets, credentials or live tokens.

A plugin cannot redefine routing, record formats, write authority, source controls, safety or persistence semantics. Documentation and dedicated agent entry points link to this contract instead of copying it.
