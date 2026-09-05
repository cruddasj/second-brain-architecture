---
title: Public-release policy
type: system
updated: 2026-09-05
---

# Public-release policy

Read this policy before publishing, exporting or generating a public artefact. The [Core contract](../CONTRACT.md) and source-control safeguards still apply.

A public architecture distribution contains generic architecture, examples and tooling only. Do not import personal knowledge, preferences, private configuration or private source material into it. Use synthetic examples for tests and documentation. Bundled examples must not assert installation, adoption, audit results or write authority for a deployed instance.

Before a public release:

- inspect the complete proposed diff for personal records, identifiers, secrets and private repository references;
- inspect indexes, memory, activity logs, source registers and themes for private facts;
- keep generated browser, graph, search and cache data containing private knowledge out of the release;
- check the inherited history separately if the source has ever contained private material; deleting current files does not remove earlier versions; and
- prefer a fresh history for a public distribution derived from a previously private knowledge repository, using the separately authorised source-control procedure.

For changes based solely on an existing public architecture repository, report the scope of the diff review accurately. Do not claim that checking new content proves all inherited history is free of personal information.
