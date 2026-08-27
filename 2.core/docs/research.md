---
title: Design research
type: research
updated: 2026-08-27
---

# Design research

This page preserves the provider-neutral research behind the second-brain architecture.

## How to use this page

Read this page when interested in why the system is structured this way. For AI agentic use, treat it as design context only: the [Core contract](../CONTRACT.md) and linked policies remain authoritative.

Research explains decisions but does not grant permission to write or override current rules. Source status and approved scope remain recorded in the [Source register](../system/source-register.md).

## Markdown knowledge architecture

Andrej Karpathy's **LLM Wiki** proposal describes a small set of durable building blocks:

1. immutable source evidence;
2. an interlinked directory of Markdown pages;
3. a schema or instruction entry point defining structure and workflows; and
4. ingest, query and lint operations.

The second brain adopts the portable parts of that pattern while adding a stricter personal-memory write gate, explicit routing, source controls and a human-readable index.

Sources:

- [LLM Wiki GitHub Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), published 2 April 2026.
- [Accompanying post](https://x.com/karpathy/status/2039805659525644595).

## Freshness and contradiction control

Cole Medin's **Your AI Second Brain Is Slowly Rotting (Here's How to Fix It)** highlights a problem with append-only memory: several historical statements can appear to be current at the same time.

The portable findings used here are:

- current **state** has one authoritative value and is replaced when it changes;
- an **event** is dated and appended;
- the small surface loaded most often needs regular freshness review;
- contradicted and unsupported claims should be identified separately;
- deterministic checks may locate repeatable candidates, but semantic judgement remains necessary; and
- a person should approve corrective writes.

Sources:

- [Video](https://www.youtube.com/watch?v=xOFkpf9KgKg), published 7 August 2026.
- [Supporting public skills repository](https://github.com/coleam00/skills).

The recurring freshness task and read-only scanner implement these portable findings without depending on a named provider or scheduling product.

Provider-specific implementation paths studied during the original design are not architectural dependencies. Their portable findings are captured here; historical provider details remain available in Git history.

## Git persistence

This repository uses Git as both persistence and audit history.

The portable findings are:

- a commit on the configured default branch is canonical;
- a branch or pull request is a proposal;
- correcting knowledge uses a later commit;
- reverting records an inverse change but does not erase the original commit; and
- historical erasure is an exceptional privacy or security operation, not ordinary forgetting.

Sources:

- [Git revert documentation](https://git-scm.com/docs/git-revert.html).
- Hosting-platform research and status decisions are recorded separately in the relevant plugin and Source register.

## Portability validation

Portability should be evaluated against materially different integration shapes, not only against the absence of provider names in Core.

The public scaffold now contains concrete adapter designs for:

- a connected-repository AI environment; and
- a local-checkout coding-agent environment with direct file, shell and Git access.

This is architecture-level validation of the Plugin/Core boundary, not a claim that every product, feature or version has been field-tested. Named implementation evidence and compatibility details belong in Plugins rather than Core.

## Three-layer result

The research led to three boundaries:

- **Plugins** connect providers and platforms.
- **Core** stores provider-neutral text instructions, processes and records.
- **Add-ons** provide optional provider-neutral skills, websites and extensions.

Use the Core README and index for normal navigation. For AI agentic use, follow AGENTS entry points, the Core contract and the policy selected for the task.
