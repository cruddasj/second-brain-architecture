# Claude Code setup

Claude Code can use a root-level `CLAUDE.md` file to load project instructions. The public architecture deliberately does not include that provider-specific root file.

## Optional root compatibility shim

A private Second Brain may add the shim only after the user explicitly accepts that doing so adds AI-provider-specific content to the repository root.

Before creating it, the setup process must tell the user:

- the file to be added is `CLAUDE.md` at repository root;
- it is specific to Claude Code;
- it exists only to make Claude Code load the existing provider-neutral `AGENTS.md` entry point; and
- it is optional and can be omitted to keep the repository root provider-neutral.

Only after explicit acceptance, create `CLAUDE.md` with exactly:

```text
@AGENTS.md
```

Then register the accepted shim in `1.plugins/root-shims.json` so validation can enforce that it remains a pointer rather than a second rule set.

If the user declines, do not create or register the root file. Claude Code can still be directed explicitly to read `AGENTS.md` when a session starts.
