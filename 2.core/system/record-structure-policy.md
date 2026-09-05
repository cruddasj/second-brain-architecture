---
title: Record structure and precise links
type: system
updated: 2026-09-05
---

# Record structure and precise links

Use this policy when creating or restructuring records. The [freshness policy](freshness-policy.md) owns state and event semantics; the [relationship policy](record-relationship-policy.md) owns associations. This policy defines their readable presentation and stable addresses.

## Reading order

Put purpose and scope first, then current state, constraints and unresolved questions, related records, and finally history and evidence. The templates provide this order while retaining the sections required for each record type. Existing valid records need no bulk migration.

Use the current-state section as the concise authoritative account. Do not add a second summary of changing facts. Keep a claim's conditions, exceptions, units, time period and uncertainty in the same entry; put shared context in clearly named sections such as `Context`, `Confirmed constraints`, `Open questions` or `Uncertainty or contradictions`.

Do not leave template instructions in saved records. Remove empty optional sections; retain `Current state` and `Event log` on knowledge records and the required decision sections. Source notes retain their evidence, permitted scope and uncertainty.

## Identity and aliases

New knowledge, decision and source-note records have a lowercase UUIDv4 `record_id` in frontmatter. Generate it once, independently of transaction IDs. It identifies the record across renames; a transaction identifies an edit. Existing records without this field remain readable and valid; add it during an authorised edit when useful.

Optional `aliases` use an inline list of stable alternative names, for example `aliases: ["release plan", "delivery plan"]`. They help search; they are not extra authoritative facts. Do not put changing status or summaries in aliases. Never copy an ID when creating a distinct record.

Continue using normal relative Markdown links with descriptive labels. An identifier helps a tool find a moved record but does not repair a broken Markdown path. Update inbound links, reciprocal links and the index in the same authorised move.

New decision records use the same record identity rather than a second decision-specific ID. Keep their status in current state, their review date in the review plan, and dated decisions in the event log. Existing legacy metadata is not silently removed or migrated.

## Precise links

Use simple, descriptive ATX headings (`##` or `###`) for durable link targets. Keep headings stable once linked; a heading change requires updating inbound anchors. Prefer plain letters, numbers, spaces and hyphens. Repeated headings acquire numeric suffixes, so unique headings make better addresses.

A direct dependency can read `Depends on: [supplier agreement](supplier-agreement.md#delivery-conditions)`. The agreement links back under its own `Related records` section with an explanation such as `Constrains: [delivery plan](delivery-plan.md)`. Link to the claim or decision that explains the connection, without copying its changing values.

The validator checks record IDs when present, local record anchor targets and reciprocal links specifically under `Related records`. It ignores code examples. Ordinary navigation and evidence citations do not require a backlink. Automatic checks support ATX headings, explicit anchor elements, inline links and reference-style links; use these conventions for precise record addresses.

## Cohesion and growth

Prefer one record per subject with a clear purpose. Split only when a subtopic has its own scope and lifecycle, not when an arbitrary length is reached. Keep a useful parent page explaining the relationship; move each fact to one authoritative home and update its links. Splitting, moving or merging needs the normal authorised-save workflow and is outside routine compaction authority.

Keep historical detail and source evidence reachable. A short top section is an entry point, not a claim that omitted history is irrelevant to every future question.
