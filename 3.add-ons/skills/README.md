# Skill workspace

This provider-neutral add-on stores reusable workflow definitions and their lifecycle records.

- [`drafts/`](drafts/): explicitly saved skill drafts that are not installed.
- [`catalogue/`](catalogue/): complete generic source copies and manifests for installed or adopted skills.
- [`catalogue/work-with-second-brain-architecture/`](catalogue/work-with-second-brain-architecture/): bundled skill for operating, maintaining and extending this architecture safely.
- [`register.md`](register.md): current generic skill lifecycle.
- [`CONTRACT.md`](CONTRACT.md): authoring, installation and composition rules.

Provider-specific discovery metadata belongs under `1.plugins/`, not inside catalogue definitions. The browser explorer may create a local draft or prepare an explicit save request, but it cannot install or adopt a skill.
