# GitHub plugin

## Purpose

This Plugin adapts Core to GitHub as a repository-hosting provider. It records GitHub-specific repository configuration and supported hosting mechanisms.

This Plugin is optional and does not redefine Core behaviour. GitHub-required files under the repository-root `.github/` directory are activation shims rather than a separate architecture layer.

## Core authority

- Core contract: [`../../2.core/CONTRACT.md`](../../2.core/CONTRACT.md)
- Core task or workflow: whichever authorised Core transaction requires repository hosting
- Relevant Core policies: [`../../2.core/system/source-control-policy.md`](../../2.core/system/source-control-policy.md)

The Plugin inherits these rules rather than copying them. Core decides canonical-state, persistence, validation and write-route semantics.

## Approved scope

This public scaffold grants no access to any GitHub account or repository.

Before use, configure the repository selected to hold the Second Brain in [repository.md](repository.md) and obtain the authority required for each operation. The Plugin applies only to the configured GitHub repository and the GitHub mechanisms needed to support authorised Core operations.

## Provider configuration

[repository.md](repository.md) is the authoritative GitHub-specific configuration file for the repository location, default branch and supported GitHub mechanisms.

The repository-root `.github/` directory contains platform-required activation files such as workflows and pull-request templates. Those files may activate GitHub behaviour but must not define Core semantics.

Do not store secrets, credentials or live tokens in this Plugin.

## Tool mapping

| Core operation | Provider action |
| --- | --- |
| Read canonical repository state | Read the configured GitHub repository and default branch |
| Persist a change using the Core-selected write route | Use the available GitHub direct-update or pull-request mechanism selected by Core |
| Validate proposed repository changes | Run the configured GitHub Actions validation when available |

## Allowed actions

- Read the configured GitHub repository when authorised for the current task.
- Use GitHub hosting mechanisms selected by Core and authorised for the current task.
- Maintain GitHub-specific configuration and platform-required activation files.

These capabilities do not create independent write authority.

## Prohibited actions

- Redefine Core routing, persistence, validation, write authority or canonical-state semantics.
- Treat `.github/` activation files as Core architecture authority.
- Access or modify repositories outside the configured scope merely because this Plugin is present.
- Store secrets, credentials or live tokens in repository files.

## Provider-owned state

The configured repository location and default branch are recorded in [repository.md](repository.md).

Live GitHub branches, pull requests, checks and other hosting state remain provider-side and are not duplicated into Core as authoritative state. This Plugin does not require a local synchronisation or processed-item register.

## Failure behaviour

Surface GitHub access, permission, branch, pull-request or workflow failures to the invoking Core operation. Core determines whether the transaction is complete, should be retried or requires user action.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin disables the GitHub hosting adapter and any GitHub-specific activation shims that depend on it.

Replacing GitHub with another Git hosting provider must not invalidate Core or alter the meaning of saved knowledge or repository records.
