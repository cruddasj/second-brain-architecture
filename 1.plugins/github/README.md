# GitHub plugin

- Plugin ID: `befe7498-69c4-4f09-913d-9b36830a9882`

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

If this Plugin supplies repository content as source material, it maps
`Plugin provider resource ID` to the stable repository resource identifier
used by its authorised lookup. Core must not receive GitHub-specific field
labels, API URLs or account details.

## Tool mapping

The optional [browser adapter](browser-explorer/README.md) supplies browser-side read-only access. [Pages deployment](browser-explorer/pages.md) documents the static application workflow and its root activation shim.

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

Live GitHub branches, pull requests, checks and other hosting state remain provider-side and are not duplicated into Core as authoritative state.

[architecture-sync.json](architecture-sync.json) is the optional instance-owned
baseline record for the Core
[architecture synchronisation procedure](../../2.core/system/source-control-policy.md#architecture-synchronisation).
Its fields are:

- `upstream_repository`: the public architecture source in GitHub
  `owner/repository` form. This is distinct from the private canonical
  repository configured in [repository.md](repository.md).
- `last_synced_commit`: `null` until a baseline is established, otherwise the
  full upstream commit ID reconciled under the Core procedure. For initial
  setup, use the exact public revision copied.

The public scaffold names its public architecture source. In
`cruddasj/second-brain-architecture`, the
[root workflow](../../.github/workflows/architecture-sync.yml) invokes the
[baseline updater](scripts/update-architecture-sync.cjs) after a pull request is
merged into `main`, recording its full `merge_commit_sha` in a separate bot
commit. This is the public distribution revision, not proof of a private sync.
The bot commit cannot contain its own SHA. A copy made at that bot commit may
retain the recorded preceding merge as its architecture baseline; for other
revisions, use the exact revision copied as described in setup.

The workflow is restricted to that exact public repository and uses only code
from `main`, including for merged fork pull requests. It skips closed unmerged
PRs, repeated events and older merges, retries file-update conflicts, and changes
only the baseline file. It uses `GITHUB_TOKEN` with job-scoped `contents: write`;
no extra secret is required. Bot writes do not trigger another workflow run.
Repository rules must permit this bot update to `main`; permission or protection
failures appear in the Actions run and leave the baseline unchanged. This
workflow does not bypass repository rules or reconcile private instances.

Preserve each private instance's record during later syncs; never copy the
public record over an established instance baseline. The record contains no
private repository location, credentials or automatic access grant.

For authorised upstream reads, resolve these values with GitHub repository,
commit and file lookups. An inaccessible repository or commit is an input
failure to report to Core; do not substitute another revision. Updating the
record and determining whether a sync is complete remain governed by Core.

## Failure behaviour

Surface GitHub access, permission, branch, pull-request or workflow failures to the invoking Core operation. Core determines whether the transaction is complete, should be retried or requires user action.

General repository validation, persistence, safety, routing and write behaviour remain governed by Core.

## Removal

Removing this Plugin disables the GitHub hosting adapter and any GitHub-specific activation shims that depend on it.

Replacing GitHub with another Git hosting provider must not invalidate Core or alter the meaning of saved knowledge or repository records.
