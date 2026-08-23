# GitHub plugin

This plugin records the repository's current hosting integration. GitHub requires workflow and pull-request files under the root `.github/` path, so that directory is an activation shim rather than a fourth architecture layer.

## Using this plugin

Use the [Core overview](../../2.core/README.md) and [Second-brain index](../../2.core/index.md) for the main second-brain guidance and saved knowledge. Read [repository.md](repository.md) only when checking the current remote, default branch or write route.

## AI agent use

AI agents follow [AGENTS.md](AGENTS.md), the [Plugin contract](../CONTRACT.md) and the [Core contract](../../2.core/CONTRACT.md). Root `.github/` files may activate hosting behaviour but cannot define Core records or add-on behaviour.

The workflow validates Core and regenerates the browser's derived view. Local or alternative Git hosting remains possible without changing Core.
