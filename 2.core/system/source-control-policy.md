---
title: Source-control and memory transaction policy
type: system
updated: 2026-10-10
---

# Source-control and memory transaction policy

This policy governs repository changes. For normal navigation through saved knowledge, use the [Core index](../index.md).

Git is both the persistence mechanism and the audit trail for this second brain. The canonical state is the configured remote default branch, not a local working tree, a chat, an open pull request or an unpushed branch.

## Canonical checkpoints

| Checkpoint | Status |
| --- | --- |
| Edited but uncommitted | Draft |
| Committed locally but not pushed | Locally durable, not canonical |
| Pushed to a topic branch or included in an open pull request | Proposed |
| Reachable from the remote default branch | Remembered |
| Removed from the current default branch by a later commit | Logically forgotten, normally still in history |

Retrieval uses only the remote default branch unless the user explicitly asks about a draft, branch or pull request.

## Default write route

Choose the write route from the complete set of changed paths:

- If any changed path is under `3.add-ons/`, use a topic branch and pull request by default.
- If no changed path is under `3.add-ons/`, make one focused commit directly to the latest remote default branch by default. This includes changes confined to `2.core/`, `1.plugins/` or repository-level files.
- A mixed change that includes `3.add-ons/` uses a pull request for the whole logical change.
- The user's current explicit instruction may override this default for a particular change.

A direct write must still start from the latest remote default branch, pass the required validation and remain one focused logical commit. A pull-request change remains proposed until merged.

## Architecture synchronisation

This procedure supports private instances copied, templated or forked from a
public architecture. It requires an explicitly authorised architecture change;
a baseline record or access to upstream does not grant write authority. Use the
[authorised save workflow](operating-rules.md#authorised-save-workflow) and the
[default write route](#default-write-route).

The selected hosting Plugin owns the upstream location and instance baseline
record. The baseline identifies the full upstream commit whose architecture
changes have been incorporated or explicitly reconciled. It is not the private
commit that performed the sync, and it does not mean the instance is identical
to upstream. The public distribution supplies an unset baseline; each private
instance maintains its own value.

1. **Establish the baseline and target.** Read the Plugin's baseline record and
   resolve both the recorded upstream revision and the intended target to
   immutable commits. Check that the baseline is an ancestor of the target.
   If the baseline is unset, do not infer it from the latest public commit or
   the private repository's HEAD. Establish the originating revision from
   reliable evidence, or explicitly reconcile the current upstream snapshot
   against the instance before setting the first baseline. If a recorded
   baseline is inaccessible or outside the target's history, stop and report
   the issue; changing it requires an explicitly authorised reconciliation
   rather than silently substituting another revision.
2. **Define scope before editing.** Identify architecture changes between the
   baseline and target, including additions, renames and deletions. Inspect the
   current instance destinations and any previously recorded adaptations or
   exclusions. Personal knowledge, memory, sources, themes, activity history,
   configured integrations and the baseline record itself are instance-owned.
   Shared file paths can also contain local policy, standing authority or
   configuration; a path being present upstream never makes it safe to replace
   wholesale. Upstream scaffold defaults must not erase those values.
3. **Compare three versions.** For each in-scope path, compare its baseline
   upstream contents, target upstream contents and current instance contents.
   Incorporate upstream-only changes and retain instance-only changes.
   Reconcile overlapping edits explicitly and stop on unresolved conflicts.
   An upstream deletion is a proposal to review, not authority to delete
   instance content. This comparison works without shared private Git history
   when the upstream snapshots remain available.
4. **Account for every upstream change.** Record intentional adaptations and
   exclusions, their affected paths, reasons and upstream target revision in
   the same transaction's Activity Log entry. Those decisions must be read
   during later syncs. A partial sync with unresolved or unreviewed changes
   leaves the completed baseline unchanged; documenting an omission alone
   does not make it an approved exclusion.
5. **Validate and persist together.** Follow the existing save workflow's
   validation, complete-diff review, logging and persistence requirements, plus
   checks appropriate to affected Plugins and Add-ons. Update the baseline in
   the same focused transaction as the reconciled architecture changes only
   when the whole selected upstream range has been accounted for. On a topic
   branch, that value is proposed; it becomes the completed instance baseline
   only when the validated transaction reaches the canonical default branch.
   Do not advance it for a failed validation or an unfinished sync.

Replacing the upstream location requires an explicitly reconciled new baseline;
do not reuse a commit ID against a different source. Keep public architecture
maintenance separate from private instance sync history and follow the
[public-release policy](public-release-policy.md) for any exported artefact.

## Transaction identity

Assign one stable UUIDv4 transaction ID before editing.

Use the canonical lowercase UUID text form:

```text
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

Generate the UUID with a standard UUID library or trusted platform function. Do not hand-build it from dates, project names, provider names, operation types or other meaningful text. A transaction ID is an opaque identity only; human-readable meaning belongs in the record content, Activity Log description and commit message.

The same UUID must be used in every record changed by the transaction, the Activity Log entry and the commit-message scope. Once a transaction becomes canonical, its UUID is immutable and must never be reassigned to another transaction.

Example UUIDv4 transaction IDs:

```text
550e8400-e29b-41d4-a716-446655440000
9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77
```

A commit cannot contain its own SHA without changing that SHA. The Activity Log therefore records `Commit: enclosing commit`. After committing, return the actual SHA to the user as the durable receipt. The commit can later be located with its transaction UUID or with `git log -- 2.core/system/activity-log.md`.

For a pull request, the topic-branch SHA is only a proposal receipt. Squash, rebase or merge may produce a different canonical SHA. After merge, report the final commit reachable from the default branch; the transaction UUID remains the stable cross-reference.

### Transaction referential integrity

Each transaction referenced by a saved `[state:...]` or `[event:...]` entry must
have exactly one matching H2 entry in `2.core/system/activity-log.md`. Use these
fields beneath a dated description (this is synthetic documentation only):

```markdown
## 2026-01-01 — Update synthetic project
- Transaction: 550e8400-e29b-41d4-a716-446655440000
- Affected paths: `2.core/knowledge/projects/synthetic-project.md`, `2.core/system/activity-log.md`
- Commit: enclosing commit
```

`Transaction` is one opaque identifier, plain or in backticks. `Affected paths`
is one comma-separated list of exact repository-relative file paths, plain or
in backticks; `Paths` is also accepted. Include every affected path, including
each record referencing the transaction. The validator checks coverage of those
referencing records; it cannot reconstruct the whole historical diff. Paths need
not still exist, because the log survives removal. The `Commit` field must appear
once with the literal value `enclosing commit`; a SHA or pending placeholder does
not express this relationship. This check validates the saved text, not Git
ancestry or the actual enclosing SHA.

The Core validator reports missing or duplicate matching entries and incomplete
or malformed transaction, path and commit fields with record/log locations.
It matches existing legacy identifiers exactly without requiring their migration;
new transactions still require UUIDv4 under the identity policy above.

The check covers structured state and event entries in live Core knowledge,
memory, source notes, themes and system registers. It ignores fenced code,
comments and frontmatter. Templates, worked examples, documentation, scripts and
test fixtures, raw sources, archives, Plugins and Add-ons are outside this join.
A fictional record placed in a live record location is checked like any other
record; fixture tests deliberately build such temporary repositories and provide
their own synthetic Activity Log. The public scaffold needs no log entries for
its teaching examples. Log entries with no current references are retained and
are not audited by this check.

### Legacy transaction IDs

Repositories created under an earlier version of this architecture may contain semantic transaction IDs such as date-and-slug identifiers.

When adopting UUID transaction IDs:

1. Use UUIDv4 for every new transaction from the migration point onwards.
2. Do not rewrite shared Git history merely to replace an old transaction ID.
3. When a current record must be migrated, assign a new UUID as its canonical transaction identity and preserve the old identifier only as a legacy alias or migration mapping where that history is still needed.
4. Do not keep provider-specific or integration-specific legacy aliases in Core. Preserve those mappings in the relevant Plugin so Core remains provider-neutral.
5. Never reuse an old identifier or UUID for a different transaction.

The UUID is the permanent identity. Human-readable labels and legacy aliases are metadata, not identities.

## Remember transaction

Use the [authorised save workflow](operating-rules.md#authorised-save-workflow) for editing, logging and validation. Persistence adds these requirements:

1. Fetch the latest remote default branch and stop on unresolved divergence or conflicts.
2. Keep one logical transaction in one focused commit, using its UUID in the commit-message scope.
3. Apply the default write route above unless the current instruction overrides it. A branch or open pull request remains proposed until its commit is reachable from the remote default branch.
4. Return the actual commit receipt using the [save confirmation format](operating-rules.md#save-confirmation-format). For a proposal, identify that no canonical commit exists yet.

For example, `system(<transaction-uuid>): update routing policy` labels an architecture change without embedding a mutable fact in the message.

## Corrections

Correct current state with a new forward commit. Do not rewrite a shared commit merely because a saved fact changed. Preserve the former value as a dated event when it remains useful history. Use a revert only when the whole earlier transaction was wrong and the whole inverse is desired.

## Forgetting modes

The word `forget` can describe materially different operations. Confirm the exact target before any of them.

### Logical forget from current retrieval

This is the default meaning after confirmation. Create a new forward commit that removes the fact from current state and any current index or pointer. Append a forget entry to the Activity Log. The original content normally remains in Git history and may remain in clones, forks, caches or backups.

Moving a page to `2.core/archive/` is not forgetting. It retains the content in the current tree and only excludes it from normal retrieval.

### Revert-assisted logical forget

Use this only when one earlier commit contains exactly the one memory transaction to undo and the inverse does not remove unrelated work.

Because the Activity Log is append-only, do not blindly revert a commit if doing so would delete its original log entry. In a command-line workflow:

1. Inspect the target commit and confirm its transaction UUID and complete diff.
2. Apply the inverse without committing, for example with `git revert --no-commit <sha>`.
3. Restore the original Activity Log entry, then append a new forget entry referencing the reverted SHA.
4. Validate the resulting current tree.
5. Commit the focused inverse as the new forget transaction and push or merge it.

If the connected GitHub surface cannot perform a revert without violating these rules, apply the equivalent inverse as a normal forward commit. A revert reverses effects with a new commit; it does not erase the original commit.

### Historical erasure

History rewriting is a separate, exceptional privacy or security operation. It may require `git filter-repo`, force-pushing every affected branch and tag, invalidating pull requests and coordinating with every clone or fork. It cannot guarantee removal from third-party copies, caches or backups.

Never interpret a routine `forget` instruction as authority to rewrite shared history. Obtain a separate, explicit confirmation that names the exact data and accepts the consequences. If a secret was committed, treat it as compromised and revoke or rotate it before repository clean-up.

## Concurrency and safety

- Never force-push for routine memory work.
- Never use `git reset --hard` or destructive clean-up as a memory operation.
- Stop on conflicts and ask rather than choosing between competing personal facts.
- Keep raw evidence immutable in normal history. Correct derived notes forward.
- Do not change visibility, collaborators, branch protection or integrations without separate authority.

## Repository configuration

Core defines the provider-neutral meaning of draft, proposed and canonical Git states. A hosting plugin records the current remote URL, default branch and supported write mode. Changing or removing that plugin must not change the record model in this policy.
