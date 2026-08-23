---
title: Theme and decision policy
type: system
updated: 2026-08-23
---

# Theme and decision policy

This policy governs themes and saved decisions. For normal navigation across related records, use the [Theme index](../themes/index.md).

Themes are non-authoritative navigation lenses across canonical knowledge. They group related knowledge, projects, questions and decisions without replacing the authoritative folder structure or copying changing values.

## Theme model

- The approved theme set is the collection of pages under `2.core/themes/`.
- Theme classification is separate from choosing an authoritative knowledge destination.
- A record may link to more than one theme when each association is clear.
- A theme page contains links and stable navigation context, not duplicated mutable state.
- The Markdown content links are the graph edges. Frontmatter, folder proximity and filename similarity do not replace them.

## Theme selection during a write

After the authoritative destination and state-versus-event classification are clear:

1. Read the theme index and the relevant existing theme pages.
2. Decide whether one or more existing themes clearly cover the record.
3. If the match is clear, update both sides of each association in the same transaction.
4. If more than one existing theme is plausible and the intended association is unclear, ask the user which theme or themes should apply.
5. If no existing theme fits and there is no clear distinct pattern, save the record without a theme.
6. If a clear, distinct theme has emerged, propose its name, purpose, boundary and initial linked records and ask whether to create it.

Do not silently create a theme, broaden an existing theme or use a theme to resolve ambiguous folder routing.

## Reciprocal content-link rule

Every approved thematic association must be represented by two relative Markdown links:

- the authoritative knowledge page links to the theme under a `## Themes` section; and
- the theme page links back to the authoritative record under `## Records` or another clearly named record section.

Add, update, move and remove both links in the same transaction. The two links must resolve to the same pair of files. A one-way link is incomplete because it fragments navigation and the derived knowledge graph.

When a record is moved or renamed, update both sides. When an association no longer applies, remove both links after clear authority to change that classification.

## Emergent-theme proposal

A new theme is warranted only when it is a durable, coherent lens that is distinct from existing themes and would usefully connect more than one authoritative record or a clear continuing stream of knowledge. A proposed theme should state:

- the proposed name and purpose;
- how it differs from existing themes;
- the initial authoritative records it would link; and
- any boundary or overlap that needs the user's decision.

Ask the user before creating it. A proposal is not approval and must not create a folder, page, index entry or link.

## Save gate

Asking a question, receiving options or making a choice in ordinary conversation does not save any of it. Create a decision record only after an explicit and unambiguous instruction to save the question, options, decision and review plan. If the authoritative destination or theme association is unclear, ask.

Options suggested by an assistant are not user facts. If the user asks to save them, label them as generated options with their date and source. The user's chosen option and reasoning must be recorded separately.

## Decision record

Use `2.core/templates/decision-record.md`. Each record contains:

1. The question and the context in which it was asked.
2. The options considered, with benefits, drawbacks and evidence.
3. The decision, decision date and reasoning.
4. A review plan with a date, measures and evidence to collect.
5. Current decision status under `## Current state`.
6. Dated decision and review events under `## Event log`.
7. Reciprocal links to every approved theme under `## Themes`.

Do not judge a past decision only by its result. At review, compare the result with the information, assumptions and aims that existed when the decision was made.

## Outcome review

Record a review as a new event and update current status in the same transaction. Use one of these outcomes:

- `Pending`: not yet due or insufficient evidence.
- `Sensible`: the process and result were broadly consistent with the original aims.
- `Mixed`: some aims were met or the result was heavily affected by outside factors.
- `Reconsider`: assumptions, process or result suggest the decision should change.
- `Superseded`: a later decision now governs the subject.

Capture what was learned and whether any reusable rule or skill should be proposed. A review does not automatically change another saved fact.

## Maintenance review

Maintenance must check for one-way theme links, records with a clear existing-theme match and coherent patterns that may justify a distinct new theme. Findings are proposals unless the maintenance task grants a narrower standing write authority. Ambiguous matches and emergent themes must be put to the user before links or theme pages are created.

## Dashboard publication gate

The browser explorer includes only records whose frontmatter contains `dashboard: true`. The default in templates is `false`.

- `dashboard: true` authorises inclusion in the private generated dashboard, not public release.
- The site must remain authenticated and owner-only unless the user separately widens access.
- Never include secrets, raw source files or archive content.
- Removing dashboard visibility is a normal state update and does not delete the underlying record.

The browser view is derived. Markdown on the canonical default branch remains authoritative.
