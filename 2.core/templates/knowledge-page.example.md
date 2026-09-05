# Worked example: fictional sample delivery

This is a fully fictional teaching example, not saved knowledge, an approved theme or authority to write. No person, organisation, preference or private source is represented. The dates, facts and UUIDs below are illustrative.

Read the first record for the complete page shape. The companion record and theme show the reciprocal links, without copying each other's changing values. The paths above each block describe a hypothetical instance layout; they are not files to create in this public scaffold.

In this scenario only, a fictional user stated the facts and explicitly authorised saving both records and their theme associations on 2030-06-01. The theme was already approved in that fictional instance. `Source: User stated` refers only to that invented scenario. The shared transaction UUID represents one fictional save; each record has its own distinct record UUID.

## Knowledge record

Hypothetical path: `2.core/knowledge/projects/sample-delivery.md`

```markdown
---
title: Sample delivery
type: knowledge
record_id: 5425517d-f58c-4e56-944e-3ef4219e6987
aliases: ["sample dispatch"]
updated: 2030-06-01
---

# Sample delivery

## Purpose and scope

Track delivery of a fictional demonstration sample. Inspection requirements belong in the linked inspection record.

## Current state

### Delivery target

- [state:sample-delivery-target] Delivery is planned for 2030-06-15, only if inspection approval is recorded before dispatch; this is a target, not a confirmed delivery date.
  - Effective: 2030-06-01
  - Last confirmed: 2030-06-01
  - Source: User stated
  - Transaction: b4cbbc23-9d80-4e29-8823-e7881ed20140

## Uncertainty or contradictions

The inspection completion date is unknown. Check the linked inspection record before treating the delivery condition as satisfied.

## Related records

- Depends on: [sample inspection approval](sample-inspection.md#approval-status), which determines whether dispatch may proceed.

## Themes

- [Sample logistics](../../themes/sample-logistics.md)

## Event log

- [event:20300601-sample-delivery-target-agreed] (2030-06-01) A conditional delivery target was agreed; inspection approval was required before dispatch.
  - Source: User stated
  - Transaction: b4cbbc23-9d80-4e29-8823-e7881ed20140
```

## Related knowledge record

Hypothetical path: `2.core/knowledge/projects/sample-inspection.md`

```markdown
---
title: Sample inspection
type: knowledge
record_id: 0236e105-535a-4943-8c3b-2b1853ee5a25
aliases: ["sample approval"]
updated: 2030-06-01
---

# Sample inspection

## Purpose and scope

Track inspection approval for the fictional demonstration sample. Delivery planning belongs in the linked delivery record.

## Current state

### Approval status

- [state:sample-inspection-approval] Inspection approval is pending. Approval requires all inspection checks to pass; a booked inspection alone does not count as approval.
  - Effective: 2030-06-01
  - Last confirmed: 2030-06-01
  - Source: User stated
  - Transaction: b4cbbc23-9d80-4e29-8823-e7881ed20140

## Related records

- Constrains: [sample delivery target](sample-delivery.md#delivery-target), which depends on inspection approval.

## Themes

- [Sample logistics](../../themes/sample-logistics.md)

## Event log

- [event:20300601-sample-inspection-requested] (2030-06-01) Inspection was requested for the demonstration sample.
  - Source: User stated
  - Transaction: b4cbbc23-9d80-4e29-8823-e7881ed20140
```

## Theme with reciprocal links

Hypothetical path: `2.core/themes/sample-logistics.md`

```markdown
---
title: Sample logistics
type: theme
slug: sample-logistics
dashboard: false
updated: 2030-06-01
---

# Sample logistics

## Purpose

Connect delivery planning and inspection for the fictional demonstration sample. This theme is navigation only; current values belong in the linked records.

## Records

- [Sample delivery](../knowledge/projects/sample-delivery.md)
- [Sample inspection](../knowledge/projects/sample-inspection.md)
```

## Applying the pattern

For an authorised real save, start from the [blank template](knowledge-page.md) and use confirmed information. Generate new record UUIDs and a fresh transaction UUID; do not copy these sample identities, dates or facts. Replace the hypothetical paths with actual destinations and follow the [knowledge save context](../CONTRACT.md#knowledge-save-context).

This example shows record content, not a completed repository transaction. A real save also updates the index when required, records its transaction history and validates and persists the change through the [authorised save workflow](../system/operating-rules.md#authorised-save-workflow). Empty optional sections are omitted here. Follow [record structure](../system/record-structure-policy.md), [record relationships](../system/record-relationship-policy.md) and [theme rules](../system/theme-and-decision-policy.md) for the governing details.
