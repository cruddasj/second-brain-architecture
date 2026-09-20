---
title: Record structure and precise links
type: system
updated: 2026-09-20
---

# Record structure and precise links

Use this policy when creating or restructuring records. The [freshness policy](freshness-policy.md) owns state and event semantics; the [relationship policy](record-relationship-policy.md) owns associations. This policy defines their readable presentation and stable addresses.

## Reading order

Put purpose and scope first, then current state, constraints and unresolved questions, related records, and finally history and evidence. The templates provide this order while retaining the sections required for each record type. Existing valid records need no bulk migration.

Use the current-state section as the concise authoritative account. Do not add a second summary of changing facts. Keep a claim's conditions, exceptions, units, time period and uncertainty in the same entry; put shared context in clearly named sections such as `Context`, `Confirmed constraints`, `Open questions` or `Uncertainty or contradictions`.

Do not leave template instructions in saved records. Remove empty optional sections; retain `Current state` and `Event log` on knowledge records and the required decision sections. Source notes retain their evidence, permitted scope and uncertainty.

## Identity and aliases

New knowledge, decision and source-note records have a lowercase UUIDv4 `record_id` in frontmatter. Generate it once, independently of transaction IDs. It identifies the record across renames; a transaction identifies an edit. Existing records without this field remain readable and valid; add it during an authorised edit when useful.

Optional `aliases` use a YAML list of stable alternative names, for example `aliases: ["release plan", "delivery plan"]`; block lists are also supported. They help search and wikilink resolution; they are not extra authoritative facts. Do not put changing status or summaries in aliases. Never copy an ID when creating a distinct record.

Use relative Markdown links with descriptive labels, or the wikilinks defined below. An identifier helps a tool find a moved record but does not repair a broken path. Update inbound links, reciprocal links and the index in the same authorised move.

New decision records use the same record identity rather than a second decision-specific ID. Keep their status in current state, their review date in the review plan, and dated decisions in the event log. Existing legacy metadata is not silently removed or migrated.

## Precise links

Use simple, descriptive ATX headings (`##` or `###`) for durable link targets. Keep headings stable once linked; a heading change requires updating inbound anchors. Prefer plain letters, numbers, spaces and hyphens. Repeated headings acquire numeric suffixes, so unique headings make better addresses.

A direct dependency can read `Depends on: [supplier agreement](supplier-agreement.md#delivery-conditions)`. The agreement links back under its own `Related records` section with an explanation such as `Constrains: [delivery plan](delivery-plan.md)`. Link to the claim or decision that explains the connection, without copying its changing values.

The validator checks record IDs when present, local record anchor targets and reciprocal links specifically under `Related records`. It ignores code examples. Ordinary navigation and evidence citations do not require a backlink. Automatic checks support ATX headings, explicit anchor elements, inline links, reference-style links and wikilinks. Heading slugs match the explorer: punctuation separates words, accents are normalised, and duplicate headings use `-2`, `-3`, and so on. An explicit heading ID such as `## Terms {#delivery-terms}` provides a stable target.

### Wikilinks

Supported examples (illustrative, not live links):

```text
[[Release Plan]]
[[Release Plan|Delivery overview]]
[[Release Plan#Delivery conditions]]
[[./release-plan.md#delivery-conditions|Conditions]]
[[2.core/knowledge/projects/release-plan]]
[[#Current state]]
```

A bare name matches a unique Markdown filename (without `.md`), frontmatter title,
or alias; an H1 supplies the title when frontmatter has none. Matching is
case-insensitive for names. Paths use exact spelling, may omit `.md`, and resolve
relative to the current file or repository root; use a leading `/` to require the
root. Multiple matching files are an error, even when one is nearby. Use an
explicit path to disambiguate. A fragment must match an existing anchor or one
unique heading title. A `|label` changes the displayed link text, not the record.

Wikilinks participate in graph edges, theme reciprocity, direct backlinks and
validation alongside ordinary Markdown links. Code, comments, escaped wikilinks
and `![[embedded content]]` are not relationships. Embeds and block-reference
syntax are not supported. Invalid, missing or ambiguous links fail validation
and remain non-clickable text in the explorer. Resolution uses the available
Markdown snapshot; raw sources are excluded, and the retrieval add-on resolves
only within its documented record scope. Prefer ordinary Markdown links for
portable navigation in readers that do not understand wikilinks.

## Validated frontmatter

The validator uses [the existing record schema](../scripts/frontmatter.py), with
safe YAML parsing and strict Pydantic types. Install its dependencies using
`python -m pip install -r 2.core/scripts/requirements.txt` from the repository root.

| Field | Rule |
| --- | --- |
| `title` | Required nonblank string |
| `type` | Required: `knowledge` or `decision` in knowledge, `source-note` in notes, `memory` in memory, `theme` on themes and `index` on the theme index |
| `updated` | Required valid calendar date in `YYYY-MM-DD` form, quoted or unquoted |
| `record_id` | Lowercase UUIDv4 when present; new records still require it under the identity policy above |
| `aliases` | Optional list of unique, nonblank strings |
| `dashboard` | Optional YAML boolean (`true` or `false`), not a quoted string |
| `slug` | Optional lowercase kebab-case string on theme records only |

Unknown or duplicate keys, malformed YAML, null values for these fields, invalid
dates, unsafe tags, YAML aliases and merge keys fail validation. No `id`, `created`,
`status` or `themes` field is introduced: record identity, state and relationships
keep their existing authoritative homes. Existing records without `record_id`
remain supported; the validator never invents identities or dates.

This schema applies to live knowledge, source notes, memory and theme pages, plus
frontmatter-bearing worked examples. Templates with placeholders, raw evidence,
archives and general documentation are outside the record schema. Fix invalid
records explicitly; validation does not rewrite them.

## Orphan checks

The validator reports a warning for each live note with no incoming or outgoing
link to another live knowledge, source-note, memory or theme record. Self-links,
external URLs, navigation indexes, system documentation, raw sources and examples
do not count. Theme pages and the scaffold's `memory/core.md` are not orphan candidates.
Both Markdown and resolved wikilinks count; one direction is enough for this check.
The separate relationship and theme reciprocity rules still apply.

Use `python 2.core/scripts/check_second_brain.py --strict-orphans` to make these
warnings fail validation. Default warnings allow deliberate standalone notes.
Do not invent relationships just to silence the check; add links only when their
meaning and authority are clear.

## Cohesion and growth

Prefer one record per subject with a clear purpose. Split only when a subtopic has its own scope and lifecycle, not when an arbitrary length is reached. Keep a useful parent page explaining the relationship; move each fact to one authoritative home and update its links. Splitting, moving or merging needs the normal authorised-save workflow and is outside routine compaction authority.

Keep historical detail and source evidence reachable. A short top section is an entry point, not a claim that omitted history is irrelevant to every future question.
