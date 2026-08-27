# Claude project instructions

Configure this file for the repository and Claude Code environment before use. Keep no secrets, credentials or tokens here.

## Claude Code

- Local checkout path: `<path-to-your-clone>`
- Configured remote: `<remote-name>`
- Default branch: `<default-branch>`
- Permitted file operations: `<read/edit scope>`
- Permitted shell and Git operations: `<for example: read, validate, commit on authorised branches; no force-push>`
- Optional hosting CLI or change-proposal mechanism: `<tool or none>`
- Optional MCP servers: `<approved servers or none>`
- Root `CLAUDE.md` compatibility shim explicitly accepted by the user: `<yes/no>`

A `yes` value must reflect a separate explicit user acceptance made after the disclosure in [SETUP.md](SETUP.md). Do not infer acceptance from installing or configuring this Plugin.

Read and follow `2.core/CONTRACT.md` as the operating authority. This file records Claude-specific environment and tool configuration only and does not redefine Core persistence, routing, safety, validation or write authority.

Do not assume another Claude product or execution environment has the same capabilities. Extend this Plugin, or split the integration deliberately, only when its actual provider-specific behaviour requires it.
