# Set up your second brain

## Contents

* [Before you begin](#before-you-begin)
* [Prerequisites](#prerequisites)
* [Guided setup](#guided-setup)
* [1. Create your private repository](#1-create-your-private-repository)
* [2. Configure storage](#2-configure-storage)
* [3. Connect an AI provider or external system](#3-connect-an-ai-provider-or-external-system)
* [4. Install the second-brain skill](#4-install-the-second-brain-skill)
* [5. Add your first useful knowledge](#5-add-your-first-useful-knowledge)
* [6. Define explicit save phrases](#6-define-explicit-save-phrases)
* [After setup](#after-setup)

## Before you begin

This guide is for people setting up a private second brain and AI agents assisting them. For an overview of the architecture, return to the [main README](README.md).

Create a **private** repository before adding personal knowledge. Keep local clones, backups and synchronised copies private too, and never store credentials in repository files.

AI agents must first read [`AGENTS.md`](AGENTS.md) and follow [`2.core/CONTRACT.md`](2.core/CONTRACT.md). This guide provides setup instructions; it does not grant authority to change repositories, install tools or configure integrations. Follow the user's authorised scope and the relevant Plugin instructions.

## Prerequisites

* **Python 3**
* **Node.js 22.13.0 or later**
* **npm**
* **Git**

Confirm they are available with:

```bash
python --version
node --version
npm --version
git --version
```

On systems where Python 3 is exposed as `python3`, use that command instead.

## Guided setup

For guided setup, first create and clone a **private** repository from this scaffold,
or extract an archive into a new directory, then run `python setup.py`.

The script prompts for `OWNER/REPOSITORY` and the canonical branch, initialises Git
for an archive and updates placeholders in Plugin instructions, including Plugin
`AGENTS.md` files when applicable. Root and Core agent pointers remain generic.
It adds `origin` only if absent, refuses a conflicting remote or dirty checkout,
and never creates a hosted repository, verifies visibility, changes an existing
branch, commits, pushes or stores credentials.

Dependency and hook installation is offered by default. It requires Python with
pip, Git, and Node.js 22.13.0 or later with npm. Use a Python virtual environment
if your system restricts pip installation. You can decline installation and follow
the manual steps below and install dependencies using the [local checks](README.md#local-checks).
If installation fails after configuration, inspect the diff and finish installation
manually; do not discard your configuration to retry.

## 1. Create your private repository

Create a **private repository** from this architecture before adding personal knowledge.

The public release deliberately uses:

```text
https://github.com/OWNER/REPOSITORY
OWNER/REPOSITORY
```

where an integration needs to identify the canonical repository.

Replace these placeholders with the details of your private repository.

At minimum, review:

* [`1.plugins/github/repository.md`](1.plugins/github/repository.md); and
* any provider Plugin you intend to use.

Your private repository becomes the canonical home of the second brain you create using this architecture.

Before customising the copy, record the exact public commit it was created from
using the selected hosting Plugin's baseline record. For the supplied GitHub
Plugin, follow its [baseline field definitions](1.plugins/github/README.md#provider-owned-state)
and populate [architecture-sync.json](1.plugins/github/architecture-sync.json).
Use the full upstream commit ID; the initial private commit is not that baseline.
For an archive, record the public revision used to produce the archive.

The public record is maintained after merged pull requests as described in the
Plugin's [baseline field definitions](1.plugins/github/README.md#provider-owned-state).
Retain it only when it identifies the revision copied or its baseline-only bot
commit; otherwise replace it with the exact copied public revision. The public
workflow is disabled by its repository guard in private copies and forks.
If an existing copy's origin cannot be established, use `null` and the Core
procedure's
[unknown-baseline reconciliation](2.core/system/source-control-policy.md#architecture-synchronisation).
This is a manual setup record; `setup.py` does not initialise it automatically.

## 2. Configure storage

Choose the default branch that will hold canonical knowledge and confirm that the repository is private.

Give integrations only the access they require. Keep credentials in the provider's secret store or connection settings rather than in the repository.

The supplied implementation uses GitHub, but Core itself is not GitHub-specific.

GitHub-specific behaviour belongs in the GitHub Plugin and can be replaced by another storage integration without changing Core.

## 3. Connect an AI provider or external system

The Plugin framework defines how provider-specific and system-specific integrations should connect to Core.

Implementations belong under:

```text
1.plugins/<provider-or-system>/
```

A minimal Plugin might contain:

```text
1.plugins/<provider-or-system>/
├── README.md
├── AGENTS.md
├── project-instructions.md
└── scheduled-jobs/
```

The exact structure can vary according to the capabilities of the system being integrated.

Plugins should map those capabilities onto shared Core workflows rather than copying or redefining Core rules.

Useful starting points are:

* [`AGENTS.md`](AGENTS.md)
* [`1.plugins/CONTRACT.md`](1.plugins/CONTRACT.md)
* [`2.core/CONTRACT.md`](2.core/CONTRACT.md)

An AI coding agent with repository access can create much of a provider-specific Plugin for you. For example:

```text
Create a Plugin that allows you to work with this second-brain repository.

Read AGENTS.md, 1.plugins/CONTRACT.md and 2.core/CONTRACT.md before making
changes.

Create the provider-specific integration under 1.plugins/<provider>/ and map
this provider's repository and tool capabilities to the shared Core workflows.

Keep provider-specific behaviour inside the Plugin and validate the repository
when finished.
```

The exact implementation will differ between providers and systems. That is intentional.

The Plugin architecture defines the boundary and contract. Individual Plugins implement it.

## 4. Install the second-brain skill

The repository includes the provider-neutral [`work-with-second-brain-architecture`](3.add-ons/skills/catalogue/work-with-second-brain-architecture/) skill.

It helps an AI agent understand:

* the three architecture layers;
* where different types of information belong;
* how durable knowledge should be saved and linked;
* how Plugins should interact with Core;
* privacy and source-handling rules; and
* which checks are required before changes are persisted.

Install it using your AI tool's normal skill mechanism.

The skill routes to the repository's `AGENTS.md` files and task-specific contract sections. It does not copy or replace their operating rules. Bundling the source does not install or adopt it for an instance; record those steps only when they actually happen.

## 5. Add your first useful knowledge

Do not try to populate an entire second brain at once.

The [fictional task-service evaluation](2.core/examples/README.md) demonstrates how
complete source, note, project and decision records link together.

Start with a subject where durable knowledge would already be useful, such as:

* a current project;
* a subject you are researching;
* a long-term interest; or
* a decision you expect to revisit.

For a continuing project, use the [project-page template](2.core/templates/project-page.md) and store it under:

```text
2.core/knowledge/projects/<project-name>.md
```

For example:

```text
Create a project called <name> in my second brain.

Use the appropriate Core template and record only confirmed information.

Link it to existing records where the relationship is clear, update navigation
where required, validate the repository and persist the authorised changes.
```

Another useful approach is to ask an AI system to interview you:

```text
Interview me about <topic or project> so that we can build useful durable
knowledge about it in my second brain.

Ask me one question at a time. Explore important facts, decisions, constraints,
events and unresolved questions.

Do not assume information I have not confirmed.

When we have enough useful material, ask for permission to save my confirmed
answers using the normal Core workflows.
```

## 6. Define explicit save phrases

It is useful to distinguish normal AI conversation from an explicit request to create durable knowledge.

For example:

```text
Remember <information>
```

could mean:

> Treat the information that follows as an explicit request to save it to my canonical second-brain repository using the normal Core save workflow.

Other explicit phrases might include:

* `Update my project ...`
* `Record this decision ...`
* `Save this source note ...`

Configure these as explicit instructions rather than loose keyword matches.

The phrase grants permission to perform the save. It does not bypass Core's rules for routing, source handling, validation or persistence.

## After setup

Use the [maintenance guidance](README.md#maintenance) for read-only health checks, validation and commit hooks. Do not rerun `setup.py` for routine health checks.

Use [Explore your second brain](README.md#explore-your-second-brain) to browse Markdown or run the optional Browser explorer locally or in a container.
