# Claude plugin agent entry point

This file is the automated-agent entry point for the Claude plugin.

Follow the [Plugin contract](../CONTRACT.md) and [Core contract](../../2.core/CONTRACT.md), then read [README.md](README.md), [SETUP.md](SETUP.md) and [project-instructions.md](project-instructions.md).

Claude-specific instructions and compatibility material stay in this Plugin. The public scaffold deliberately contains no root `CLAUDE.md` file.

If configuring a private Second Brain for Claude Code, do not create `CLAUDE.md` automatically. First tell the user that adding it will place Claude-specific content at repository root, explain that its only proposed content is `@AGENTS.md`, and obtain explicit acceptance. Only after that acceptance may the setup create the file and register it in `1.plugins/root-shims.json`. If the user declines, leave the root unchanged.
