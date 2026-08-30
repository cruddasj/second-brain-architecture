---
title: Directory and routing
type: system
updated: 2026-08-30
---

# Directory and routing

Use the [Second-brain index](../index.md) for normal navigation. This page provides detailed routing guidance. For AI agentic use, read it after the [Core contract](../CONTRACT.md) and before choosing a write destination.

Use a folder only when one destination is clearly the best match. If more than one destination is materially plausible, ask the user. Do not use a silent fallback when classification is unclear.

## Authoritative knowledge routes

| Path | Use |
| --- | --- |
| `2.core/memory/core.md` | Small, high-value current state used across many topics |
| `2.core/knowledge/about-me/` | Personal facts, preferences, goals and recurring choices |
| `2.core/knowledge/work/` | Professional roles, organisations and recurring work practices |
| `2.core/knowledge/projects/` | Continuing projects, their status, decisions and constraints |
| `2.core/knowledge/life-admin/` | Household, travel and other practical administration |
| `2.core/knowledge/interests-and-learning/` | Hobbies, reading and durable learning goals |
| `2.core/knowledge/health-and-wellbeing/` | Sensitive health and wellbeing information saved on explicit instruction |
| `2.core/knowledge/people-and-relationships/` | Minimal, purpose-specific information about other people |

Topic-specific state stays on its subject page. Core memory is not a general fallback.

## Evidence and navigation routes

| Path | Use |
| --- | --- |
| `2.core/sources/raw/` | Original, immutable source material |
| `2.core/sources/notes/` | Summaries and comparisons derived from raw sources |
| `2.core/themes/` | Non-authoritative navigation across related records |
| `2.core/index.md` | Main navigation page |
| `2.core/docs/` | Provider-neutral design explanation and research |

Source locators stored in these evidence routes follow the
[provider-neutral source reference policy](source-reference-policy.md).
Provider names, provider-specific metadata labels and resource resolution
rules belong under `1.plugins/`.

Choose the authoritative record before considering a theme. Theme rules and reciprocal links are defined in [theme-and-decision-policy.md](theme-and-decision-policy.md).

Direct relationships between authoritative records are separate from folder routing and themes. Record them using the reciprocal links defined in the [Record relationship policy](record-relationship-policy.md), without copying mutable state.

## System and lifecycle routes

| Path | Use |
| --- | --- |
| `2.core/system/` | Governance, source decisions and activity history |
| `2.core/templates/` | Provider-neutral record shapes |
| `2.core/archive/` | Retained but inactive material excluded from normal retrieval |
| `1.plugins/` | Optional provider and external-system adapters |
| `3.add-ons/` | Optional provider-neutral skills, websites and extensions |

The browser explorer is derived and never an authoritative destination.

## Naming

- Use lowercase `kebab-case.md` filenames.
- Prefer one durable page per subject over fragments.
- Use globally unique `state:<subject-key>` and `event:<date-subject-key>` identifiers.
- Add `YYYY-MM-DD` to event, review and snapshot filenames.
- Search before creating a page.
- Do not create a folder for one note unless the subject is clearly ongoing.

Detailed state and event behaviour belongs to the [Freshness policy](freshness-policy.md), not this routing page.

## Common ambiguities

- Professional training may be Work or Interests and Learning.
- A household budget may be Life Admin or a continuing project.
- A preference used only within one project may belong to About Me or that project.
- An article may be a raw source, while a chosen takeaway belongs on a knowledge page.
- A financial subject may belong to Life Admin, About Me or a project; the Finances theme does not choose its authoritative home.

Ask when the choice would change which record owns the information.
