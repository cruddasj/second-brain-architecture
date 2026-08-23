---
title: Source-control and memory transaction policy
type: system
updated: 2026-08-23
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

## Transaction identity

Assign one stable transaction ID before editing:

- `mem-YYYYMMDD-short-slug` for a state save or update
- `evt-YYYYMMDD-short-slug` for an event
- `fgt-YYYYMMDD-short-slug` for a logical forget
- `src-YYYYMMDD-short-slug` for a source decision
- `sys-YYYYMMDD-short-slug` for governance or structure

If two transactions would otherwise collide, add a short time or numeric suffix. Put the same ID in the knowledge entry, Activity Log entry and commit-message scope.

A commit cannot contain its own SHA without changing that SHA. The Activity Log therefore records `Commit: enclosing commit`. After committing, return the actual SHA to the user as the durable receipt. The commit can later be located with its transaction ID or with `git log -- 2.core/system/activity-log.md`.

For a pull request, the topic-branch SHA is only a proposal receipt. Squash, rebase or merge may produce a different canonical SHA. After merge, report the final commit reachable from the default branch; the transaction ID remains the stable cross-reference.

## Remember transaction

1. Start from the latest remote default branch. Fetch first and stop on unresolved divergence or conflicts.
2. Confirm the explicit save authority, exact content and unambiguous folder.
3. Assign a transaction ID and classify the fact as state or event.
4. Update the authoritative page, index and Activity Log atomically.
5. Run `python 2.core/scripts/check_second_brain.py` and inspect the diff.
6. Commit one logical memory operation. Do not mix unrelated memories in one commit.
7. Apply the default write route above: open a focused pull request if any changed path is under `3.add-ons/`; otherwise push the focused commit directly to the remote default branch, unless the user's current explicit instruction overrides the default.
8. A direct save is complete after the commit is reachable from the remote default branch. A pull-request save remains pending until merge.
9. Confirm the transaction ID, canonical commit SHA, branch status and files changed. If a pull request is still open, report only the proposal SHA and say that no canonical SHA exists yet.

Suggested messages:

```text
memory(mem-20260815-communication): remember communication preference
event(evt-20260815-project-decision): record project decision
forget(fgt-20260815-old-preference): remove saved preference
system(sys-20260815-routing): update routing policy
```

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

1. Inspect the target commit and confirm its transaction ID and complete diff.
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
