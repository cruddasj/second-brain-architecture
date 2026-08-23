# Second-brain change

## Operation

- [ ] Current-state save or correction
- [ ] Event save
- [ ] Logical forget or revert-assisted forget
- [ ] Source ingest or source-status decision
- [ ] Skill or plugin lifecycle update
- [ ] Maintenance or archive
- [ ] Structure or governance change

## Transaction

- Transaction ID:
- State or event classification:
- Target default branch:
- Prior commit being reversed, if any:

## Explicit authority

State the user's unambiguous instruction that authorised this write. Do not include sensitive conversational detail beyond what is needed for review.

## Changes

List the pages and folders changed.

## Ambiguity and sensitivity

Confirm that the destination and state-or-event classification were unambiguous. Note any sensitive information, inference, contradiction or unresolved point.

For a forget operation, state whether this is archive, logical forgetting from current retrieval, revert-assisted logical forgetting, or separately authorised history rewriting. A deletion or revert does not erase ordinary Git history.

## Checks

- [ ] Save intent, exact content and destination were clear.
- [ ] One logical memory operation is isolated in this transaction.
- [ ] State replaces one globally unique current key, or the event is timestamped and appended.
- [ ] No silent Inbox fallback or unapproved folder creation occurred.
- [ ] Existing knowledge was updated instead of duplicated where possible.
- [ ] `2.core/index.md` and `2.core/system/activity-log.md` were updated where required.
- [ ] A revert-assisted forget preserves the original Activity Log entry and appends a new one.
- [ ] Source, skill and plugin statuses follow their explicit approval rules.
- [ ] Core and add-on architecture, code, formats, examples and documentation contain no named AI-provider assumption or instruction.
- [ ] Any provider-specific adapter, research, source record, compatibility note or historical instruction is contained in the matching `1.plugins/<provider-or-system>/` directory.
- [ ] Provider-specific guidance remains optional and cannot redefine Core.
- [ ] No secret or authentication material is included.
- [ ] `python 2.core/scripts/check_second_brain.py` passes.

## Canonical status

This pull request is proposed memory. It becomes remembered only when its commit is reachable from the configured remote default branch.
