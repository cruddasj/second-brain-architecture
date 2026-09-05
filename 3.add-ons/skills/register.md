---
title: Skill register
type: register
updated: 2026-09-05
---

# Skill register

Installation and adoption are separate decisions. Provider-specific plugin lifecycle records live under `1.plugins/`.

## Status definitions

- `Bundled`: distributed source only; no instance installation or adoption implied.
- `Experimental`: installed or enabled for evaluation.
- `Adopted`: explicitly confirmed for regular use.
- `Disabled`: retained but not active.
- `Uninstalled`: removed from the environment.
- `Retired`: no longer intended for use, while history remains.

## Bundled catalogue

- [Work with the Second Brain architecture](catalogue/work-with-second-brain-architecture/): available source package; no instance installation or adoption is recorded.

## Instance lifecycle

No instance lifecycle events are included in the public scaffold. Record actual authorised installation and adoption in the deployed repository, not in this distribution.

## Entry format

Each entry includes name, type, origin, installation date, version when known, purpose, access notes, current status, adoption date and dated lifecycle events.
