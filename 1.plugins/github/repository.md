---
title: GitHub repository configuration
type: integration
updated: 2026-08-23
---

# GitHub repository configuration

Use this file when checking repository hosting or write routes. For AI agentic use, read it after the [GitHub plugin README](README.md), [Plugin contract](../CONTRACT.md) and [Core contract](../../2.core/CONTRACT.md).

Replace `OWNER/REPOSITORY` with the user's private GitHub repository before using this adapter.

- Canonical remote: `https://github.com/OWNER/REPOSITORY`
- Default branch: `main`
- Default write mode for changes that do not touch `3.add-ons/`: direct focused commits to `main`
- Default write mode for any change that touches `3.add-ons/`: topic branch and pull request
- Mixed changes that include `3.add-ons/`: topic branch and pull request for the whole logical change
- Explicit user instructions may override these defaults for a particular change

These provider-specific values implement the neutral source-control semantics in [`../../2.core/system/source-control-policy.md`](../../2.core/system/source-control-policy.md).
