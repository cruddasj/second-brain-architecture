# Second-brain operating contract

This is the provider-neutral authority for Core. It defines the rules; the linked policies define the detailed procedures. Plugins and add-ons cannot override it.

Start with [AGENTS.md](AGENTS.md), read this contract, then select the task route below. Load applicable sections and their required references, not every linked document.

## Core invariants

- **Authority:** the user's current explicit instruction comes first, followed by this contract and its policies, canonical saved knowledge, approved sources and optional plugin guidance.
- **Canonical state:** only the configured remote default branch is remembered. Conversations, local edits, topic branches and open pull requests are not canonical knowledge.
- **Default is read-only:** discussion, research, recommendations, links and uploads do not authorise a repository write.
- **Explicit saves:** write only after a clear instruction to remember, save, record, add, update, correct or remove information.
- **No self-authorising tasks:** a bundled task definition may constrain separately granted standing authority, but its presence, installation, schedule or invocation cannot create write authority.
- **Text-only Core:** Core knowledge, instructions and processes are plain text and remain usable without a named AI provider, product, model, API, SDK or managed memory service.
- **One authoritative home:** keep each changing value in one place and link to it elsewhere.
- **State and events:** replace a changing current state; append a dated event.
- **User confirmation:** ask when the destination, state-versus-event classification, direct record relationship, theme association, safety or requested operation is materially unclear; use the [unattended ambiguity fallback](system/operating-rules.md#unattended-ambiguity) when no user is present.
- **Minimum useful content:** retain only what is needed for later retrieval, including source, date and transaction lineage.
- **Safety:** never store secrets or authentication material, and minimise sensitive or third-party personal information.
- **Write completion and receipt:** an attempted authorised save is not complete until its persistence result has been reported using the canonical [save confirmation format](system/operating-rules.md#save-confirmation-format). A successful canonical write must report the transaction UUID and actual commit reachable from the configured remote default branch. A proposed branch or pull-request commit must not be reported as canonical. Integrations may control presentation only when they preserve the required fields, status semantics and proposed-versus-canonical distinction.

## Task context

### Common tasks

| Task | Required additional context |
| --- | --- |
| Answer from saved knowledge | [Read workflow](system/operating-rules.md#read-workflow), cross-topic memory and authoritative record with relevant context; use the index only as needed to locate records |
| Prepare any repository change | [Write context](#write-context) and current destination files |
| Save or update knowledge | [Write context](#write-context) and [knowledge save context](#knowledge-save-context) |
| Ingest or cite source material | [Source ingestion](system/operating-rules.md#source-ingestion), [source register](system/source-register.md), [source reference policy](system/source-reference-policy.md) and selected source adapter; add [write context](#write-context) when saving |

### Specialist tasks

| Task | Required additional context |
| --- | --- |
| Design or change a task, Plugin or Add-on | [Integration design](system/integration-design-policy.md) and the relevant layer entry point and contract; add [write context](#write-context) when editing |
| Audit freshness | [Freshness audit task](system/freshness-audit-task.md) and its required inputs |
| Compact history | [Compaction task](system/knowledge-compaction-task.md) and its staged inputs |
| Review themes | [Theme review task](system/theme-review-task.md) |
| Save or review a decision | Knowledge save route plus the theme policy's [Save gate](system/theme-and-decision-policy.md#save-gate), [Decision record](system/theme-and-decision-policy.md#decision-record) and, when reviewing an outcome, [Outcome review](system/theme-and-decision-policy.md#outcome-review) |
| Correct, archive or forget | [Write context](#write-context) and applicable [corrections and forgetting procedures](system/source-control-policy.md#corrections); read legacy transaction guidance only when migrating old identifiers |
| Publish or export | [Public-release checks](system/public-release-policy.md) and relevant layer and integration instructions; add [write context](#write-context) when editing |

### Knowledge save context

For an ordinary knowledge save, load:

- the [directory's opening routing rule](system/directory.md#directory-and-routing), [Authoritative knowledge routes](system/directory.md#authoritative-knowledge-routes) and [Naming](system/directory.md#naming); add [Common ambiguities](system/directory.md#common-ambiguities) when ownership is unclear;
- the [freshness policy](system/freshness-policy.md), excluding its audit procedure;
- the full [record relationship policy](system/record-relationship-policy.md), whose creation, reciprocity, boundary and save checks all apply; and
- the theme policy's [Theme model](system/theme-and-decision-policy.md#theme-model), [Theme selection during a write](system/theme-and-decision-policy.md#theme-selection-during-a-write) and [Reciprocal content-link rule](system/theme-and-decision-policy.md#reciprocal-content-link-rule).

Load [Evidence and navigation routes](system/directory.md#evidence-and-navigation-routes) when writing sources, indexes or themes, and [System and lifecycle routes](system/directory.md#system-and-lifecycle-routes) for those destinations. A new-theme proposal also needs [Emergent-theme proposal](system/theme-and-decision-policy.md#emergent-theme-proposal). Saving decisions uses the specialist route above; changing browser inclusion needs the [Dashboard publication gate](system/theme-and-decision-policy.md#dashboard-publication-gate).

### Write context

For every repository change, read:

- the [Save gate through save confirmation](system/operating-rules.md#save-gate) and [privacy and safety](system/operating-rules.md#privacy-and-safety);
- the source-control [checkpoints](system/source-control-policy.md#canonical-checkpoints), [write route](system/source-control-policy.md#default-write-route), [transaction identity](system/source-control-policy.md#transaction-identity), [remember transaction](system/source-control-policy.md#remember-transaction) and [concurrency and safety](system/source-control-policy.md#concurrency-and-safety); and
- each current destination file immediately before editing.

Combine routes for mixed tasks. Routing reduces retrieval, not the scope of applicable rules. Before acting on a newly discovered concern, load its governing section. If section retrieval is unavailable or omits context needed to interpret a rule, read the full file.

When creating or restructuring a record, use the [record structure policy](system/record-structure-policy.md) for readable order, stable identity and precise links.

Reuse instructions already loaded in the current session only after confirming their content version is unchanged on the canonical branch, using a file hash or equivalent revision evidence. A changed branch revision requires checking the relevant files, not automatically rereading all of them. Reload changed, missing or truncated instructions. Re-read destination files immediately before editing and check canonical branch freshness before persistence. Conversation summaries and caches are not authority.

The [index](index.md) lists the detailed policies. The repository README is human orientation, not a mandatory read for each routine operation.

### Shared Core interfaces

`2.core/scripts/record_text.py` is a stable, provider-neutral read-only interface for Markdown record conventions used by Core validators and optional Add-ons. Its public functions are `visible_lines`, `metadata`, `headings`, `anchors`, `sections`, `links` and `local_target`. Keep this path and these function meanings compatible; a breaking change requires updating its documented consumers and validation in the same transaction. The module parses the repository's limited record conventions and is not a general Markdown renderer.

## Behaviour ownership and integration design

For task, Plugin or Add-on design, follow the [integration design policy](system/integration-design-policy.md). Each behaviour has one authoritative owner; link to it rather than copying its rules.

## Authorised write outcome

Follow the [authorised save workflow](system/operating-rules.md#authorised-save-workflow) and [source-control policy](system/source-control-policy.md#remember-transaction). Validate with `python 2.core/scripts/check_second_brain.py`, keep one transaction and Activity Log entry, and report canonical or proposed status accurately. Do not claim completion if validation, required logging or persistence failed.

## Layer boundaries

- **Core** contains provider-neutral knowledge, instructions, processes, templates and governance.
- **Plugins** contain optional provider, platform and external-system adapters. They may map tools and setup, but cannot redefine Core.
- **Add-ons** contain optional provider-neutral skills, websites and other products built above Core.
- Removing a plugin or add-on must not invalidate Core.
- A platform-required root shim must be explained by its plugin and contain no independent architecture.
- Provider-specific research, metadata and compatibility material stays in the matching plugin.

## Corrections and removal

Correct ordinary knowledge with a later forward commit. Archive, logical forgetting, revert and historical erasure are different operations and require the safeguards in the source-control policy. Confirm the exact target and mode before any destructive or privacy-sensitive change.
