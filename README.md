# Second brain

A Git-backed, Markdown-first system for keeping durable knowledge in a portable three-layer architecture.

This work builds on and extends [Andrej Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), a pattern for using LLMs to incrementally build and maintain a persistent, interlinked Markdown knowledge base from source material. This repository develops that core idea into a portable architecture with explicit Core, Plugin and Add-on layers, governance, source handling, maintenance processes and provider-agnostic integration patterns.

> [!IMPORTANT]
> **Keep every copy of your second brain private.** A second brain can accumulate personal, financial, professional and other sensitive records over time. If you use GitHub for storage, create a **private repository** and restrict access to yourself and only the tools or integrations you explicitly authorise. A public repository makes its committed contents visible to others and is not appropriate for storing private durable memory. The same principle applies when cloning or copying the repository: every local clone, backup, synchronised folder or other copy contains the same potentially sensitive records, so store it only on accounts, devices and locations that only you can access. Review repository access and connected integrations regularly, and never commit passwords, API keys or other credentials even to a private repository.

## Why portable memory matters

Durable memory becomes more valuable as it grows. Keeping that memory inside a particular AI provider risks making accumulated knowledge dependent on that provider's products, formats, retention model and continued availability. The second brain therefore treats durable knowledge as user-controlled data rather than a feature of any individual AI service.

Core is deliberately stored as ordinary text and Markdown so that its knowledge can outlive the tools used to create or consume it. AI providers are replaceable interfaces to the second brain, not owners of its memory. Moving to another model, agent or provider should require a new integration rather than rebuilding the knowledge base.

Git provides a useful foundation for this portability. This repository currently uses GitHub as its canonical storage because it combines widely supported repository access with source control. Many tools and AI providers can work with GitHub directly or through standard Git workflows, allowing different providers and agents to read and update the same durable memory without making any one of them the system of record.

Using GitHub also gives the knowledge base the normal benefits of source control: a history of changes, attribution, comparison, rollback, branching where appropriate, and a clear canonical state. GitHub itself is kept behind the Plugin boundary, however. The durable Core remains plain files in a Git repository so that the storage host can also be replaced without redesigning the second brain.

## Architecture

![Diagram showing Plugins updating a repository-provided, text-only Core and Add-ons extending it](assets/images/second-brain-architecture.jpg)

The architecture separates portable knowledge from the integrations and products that use it:

1. **Plugins integrate external systems.** Optional adapters and instructions connect providers, platforms and other systems to Core. They can support scheduled synchronisation, AI provider integration instructions or ad hoc actions. Each plugin translates external actions into operations governed by the Core contract and cannot redefine how the second brain works. The repository includes [GitHub and OpenAI plugins](1.plugins/README.md), and more can be built as needed.
2. **Core is the portable second brain.** Core is included in this repository and remains AI-provider agnostic. It uses text files to hold policies, repeatable processes and durable records, with links that form a navigable knowledge graph. Its current canonical copy is stored in GitHub, but its text-only design keeps it readable, versioned and portable.
3. **Add-ons extend Core.** Optional AI-provider-agnostic products build on Core without becoming part of it. The repository includes a [personal website](3.add-ons/browser-explorer/README.md), and a [skill catalogue](3.add-ons/skills/README.md) template. You can add skills that work with Core or build them from its content, and create further extensions as needed. Removing an add-on does not invalidate Core.

| Layer | Purpose | Portability rule |
| --- | --- | --- |
| [`1.plugins/`](1.plugins/README.md) | Provider or platform-specific integrations and instructions | May be provider-specific but cannot redefine Core |
| [`2.core/`](2.core/README.md) | Policies, processes, records, memory, sources, templates and governance | Strictly AI-provider agnostic and independently usable |
| [`3.add-ons/`](3.add-ons/README.md) | Skills, the personal website and other optional extensions | Strictly AI-provider agnostic, independently usable, and removable |

Plugins provide controlled ways to update Core. Add-ons consume or extend Core. GitHub is the current storage provider, with its hosting-specific configuration isolated in the GitHub plugin.

## Practical setup

### Replace the repository placeholder first

The public release deliberately uses `https://github.com/OWNER/REPOSITORY` and `OWNER/REPOSITORY` as placeholders wherever an integration needs to identify the canonical GitHub repository.

Before storing personal knowledge or connecting an AI provider, create your own **private** GitHub repository and replace those placeholders with its real URL and repository name. At minimum, review [`1.plugins/github/repository.md`](1.plugins/github/repository.md) and any provider adapter you intend to use, such as [`1.plugins/openai/project-instructions.md`](1.plugins/openai/project-instructions.md).

For example, replace:

```text
https://github.com/OWNER/REPOSITORY
OWNER/REPOSITORY
```

with the URL and `owner/repository` identifier for your own private second-brain repository. Do not replace the placeholders with a public repository that will later contain personal records.

### 1. Choose storage and an AI provider

1. Create or use a **private repository** under your control. If using GitHub, confirm its visibility is set to private before adding personal or sensitive knowledge, and grant access only to yourself and integrations you explicitly trust.
2. Replace every `https://github.com/OWNER/REPOSITORY` or `OWNER/REPOSITORY` placeholder used by the GitHub and AI-provider plugins with your private repository details.
3. Protect every clone and copy of the repository. A local clone contains the same records as the private remote repository, so keep it on a device and user account that only you can access. Apply the same rule to backups, synchronised folders and copies created by development or AI tools.
4. Put the repository under version control and identify the remote default branch that will hold canonical knowledge.
5. Give the chosen AI provider only the repository access it needs to read the repository and to propose or commit authorised changes.
6. Create a self-contained adapter under `1.plugins/<provider>/`. Keep tool names, authentication, repository connection steps and scheduler configuration inside that plugin.
7. Make the adapter direct agents to the root [`AGENTS.md`](AGENTS.md) and [Core contract](2.core/CONTRACT.md). It must translate provider actions into the shared Core workflows rather than restating or weakening them.
8. Keep credentials in the provider's secret store or connection settings. Never commit them, even when the repository is private.

A minimal provider plugin can contain:

```text
1.plugins/<provider>/
├── README.md                 # setup and connection guidance
├── AGENTS.md                 # optional agent entry point
├── project-instructions.md   # thin pointer to the shared Core rules
└── scheduled-jobs/           # provider-specific job configuration
```

The files inside this example may use the selected provider's real tool names. Core and Add-ons must not.

### 2. Connect the main integration types

| Integration | Practical example | Where its configuration belongs |
| --- | --- | --- |
| Ad-hoc action | A user asks an agent to read `AGENTS.md`, then record a confirmed fact or update a project. The adapter opens the repository, applies the Core save workflow, validates the change and persists it using the configured write route. | `1.plugins/<provider>/` |
| Scheduled task | A recurring job opens the latest canonical branch and follows [the knowledge compaction task](2.core/system/knowledge-compaction-task.md). A separate job may run the [report-only freshness audit](2.core/system/freshness-audit-task.md). | Scheduler details under `1.plugins/<provider>/scheduled-jobs/`; neutral task definitions remain in Core |
| AI provider integration | Provider project instructions point to `AGENTS.md`, map repository read and write operations to the provider's tools, and explain how the provider reports commits, proposals and failures. | `1.plugins/<provider>/project-instructions.md` |

Example ad-hoc instruction:

```text
Use my canonical second-brain repository. Read AGENTS.md and the linked Core rules.
Record the following confirmed information in the correct authoritative page, update
related indexes and theme links where required, validate the repository and report
the resulting transaction and canonical commit.
```

Example scheduled compaction instruction:

```text
Open the latest canonical default branch and follow
2.core/system/knowledge-compaction-task.md exactly. Make only the changes that task
authorises. If nothing qualifies, make no repository change and return its no-op report.
```

Configure that instruction as a recurring job using the selected provider's scheduler. Weekly is the intended cadence for the supplied compaction task. The provider plugin should record how the job is created, connected to the repository, updated, paused and removed without putting provider-specific fields into Core.

### 3. Create projects

Start a continuing project by copying [the project-page template](2.core/templates/project-page.md) to `2.core/knowledge/projects/<project-name>.md`. Record its current status, purpose, confirmed constraints, dated events, sources and unresolved questions. Add it to the [Core index](2.core/index.md) and create reciprocal links to any clearly applicable existing themes.

An agent can do this from a request such as:

```text
Create a project called <name> in my second brain. Use the project template, record
<confirmed purpose and constraints>, link the source material I provide, update
navigation and themes where clear, validate the repository and persist the change.
```

Projects are authoritative knowledge pages, not containers for every supporting document. Keep source evidence in the Sources area and link to it.

### 4. Feed knowledge and sources into Core

There are two common routes:

- **Confirmed knowledge:** explicitly ask the agent to save or update a fact. It writes the current value or dated event to the relevant authoritative page under `2.core/knowledge/`.
- **Documents and other evidence:** use a provider or external-system plugin to sync original material into `2.core/sources/raw/<source-or-collection>/`. Keep raw evidence unchanged where practical. Put summaries, comparisons and extracted notes under `2.core/sources/notes/`, then link supported claims from the relevant knowledge or project page.

A source-sync integration should only copy evidence into the agreed Sources path. Synchronisation does not itself approve a source or authorise changes to curated knowledge. Source status and permitted scope remain governed by the [Source register](2.core/system/source-register.md), and ingestion follows the [Core operating rules](2.core/system/operating-rules.md).

After any authorised change, run:

```bash
python 2.core/scripts/check_second_brain.py
```

A save is complete only when its focused commit is reachable from the configured canonical default branch.

## Repository layout

The root contains this entry point, the standard AI-agent discovery pointer (`AGENTS.md`), the three architecture layers and platform-required files. The `.github/` directory is an activation shim explained by the [`1.plugins/github/`](1.plugins/github/README.md) plugin, not a fourth architecture layer.

Named AI-provider instructions, formats, research and compatibility material belong only inside the matching plugin. They must never be required by Core or copied into an add-on.

## Start here

- Browse saved knowledge through the [`2.core/index.md`](2.core/index.md) index.
- Learn what Core contains in the [`2.core/README.md`](2.core/README.md) overview.
- Review the shared rules in the [`2.core/CONTRACT.md`](2.core/CONTRACT.md) operating contract.
- For AI agentic use, start with [`AGENTS.md`](AGENTS.md).

## Local checks

The full local check set uses both the Core Python validator and the browser-explorer Node.js toolchain. Install these prerequisites first:

- **Python 3** to run `2.core/scripts/check_second_brain.py`.
- **Node.js 22.13.0 or later** for the browser explorer.
- **npm**, normally installed with Node.js, to install dependencies and run the browser checks.
- **Git** because the browser data builder reads the set of committed Markdown files from the repository.

You can confirm the main tools are available with:

```bash
python --version
node --version
npm --version
git --version
```

On systems where Python 3 is exposed as `python3` rather than `python`, use `python3` in the commands below.

Run the checks from the repository root:

```bash
python 2.core/scripts/check_second_brain.py
npm --prefix 3.add-ons/browser-explorer ci
npm --prefix 3.add-ons/browser-explorer run brain:check
npm --prefix 3.add-ons/browser-explorer test
```

Routine authorised saves follow the [`2.core/system/source-control-policy.md`](2.core/system/source-control-policy.md). The current hosting configuration is recorded in [`1.plugins/github/repository.md`](1.plugins/github/repository.md).

## Licence

This repository is licensed under the [Apache License 2.0](LICENSE.md).
