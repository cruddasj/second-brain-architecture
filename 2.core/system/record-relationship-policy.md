---
title: Record relationship policy
type: system
updated: 2026-08-30
---

# Record relationship policy

This policy governs direct relationships between authoritative Core records. It does not govern themes, source evidence or routine navigation links.

Direct record relationships make durable context and dependencies visible without copying changing values between pages. Each changing value still has one authoritative home.

## When to create a relationship

Create a direct relationship when two authoritative records have a clear, durable context or dependency that helps a reader understand either record.

Do not create a relationship merely because records:

- are stored in the same folder;
- have similar names;
- share a broad subject; or
- both link to the same theme or source.

If the relationship is unclear, do not infer it. Ask when the answer would materially affect the authorised save; otherwise complete the save without the relationship.

## Reciprocal link rule

Represent every approved direct relationship with two relative Markdown links:

- each authoritative record links to the other under `## Related records`; and
- both links are added, updated or removed in the same transaction.

Add a short description when the record titles alone do not explain the relationship. Link to the authoritative record instead of repeating its mutable state.

Use precise, stable section links when they explain the relationship better than a whole-page link. Follow the [record structure policy](record-structure-policy.md) for identifiers, anchors and moves. The validator checks that each direct backlink appears under `Related records`, not merely elsewhere on the target page.

When a related record is moved or renamed, update both links. When an authorised change ends the relationship, remove both links in the same transaction. A one-way link under `## Related records` is incomplete.

The section may be omitted when a record has no clear direct relationship. Add it to both existing records when creating their first relationship.

## Relationship boundaries

- Theme membership belongs under `## Themes` and follows the [Theme and decision policy](theme-and-decision-policy.md).
- Source citations and evidence links follow the [Source reference policy](source-reference-policy.md) and are not reciprocal record relationships.
- Index, table-of-contents and other navigation links do not require a backlink.
- A direct relationship does not make either record authoritative for the other's changing state.

## Authorised save check

During an authorised save, review the destination record and the relevant existing records found through the index and explicit links. Add reciprocal `Related records` links when the relationship is clear and durable. Keep this semantic review separate from folder routing and theme classification.
