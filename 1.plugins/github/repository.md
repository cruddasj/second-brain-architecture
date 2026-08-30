---
title: GitHub repository configuration
type: integration
updated: 2026-08-30
---

# GitHub repository configuration

Use this file for GitHub-specific repository configuration. For AI agentic use, read it after the [GitHub Plugin README](README.md), [Plugin contract](../CONTRACT.md) and [Core contract](../../2.core/CONTRACT.md).

Before use, replace `OWNER/REPOSITORY` with the repository selected to hold the Second Brain.

## Repository configuration

- Hosting provider: GitHub
- Canonical remote: `https://github.com/OWNER/REPOSITORY`
- Default branch: `main`

## Dependabot auto-merge

The supplied repository-root `.github/workflows/dependabot-auto-merge.yml` workflow requires GitHub's repository-level **Allow auto-merge** setting. Enable it manually under **Settings → General → Pull Requests** before relying on the workflow.

Agents configuring a repository that uses this workflow must explicitly advise the user about this setting. Do not assume it is enabled or change repository settings without separate authority.

## Supported write mechanisms

This adapter supports:

- direct Git pushes to the configured default branch; and
- GitHub pull requests from topic branches.

The Core [source-control policy](../../2.core/system/source-control-policy.md) decides which write route applies to a particular change. This Plugin records the available GitHub mechanisms and repository-specific values only.

## Activation shim

GitHub requires workflows, pull-request templates and related platform files under the repository-root `.github/` directory.

That directory is a GitHub activation shim. It does not define Core behaviour or create a fourth architecture layer.

## Removal

Replacing GitHub with another Git hosting provider requires replacing this hosting adapter and any GitHub-specific activation files.

Core Git semantics, saved knowledge and repository records remain valid independently of GitHub.