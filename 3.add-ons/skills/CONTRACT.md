# Skill authoring and composition contract

The skill workspace teaches reusable workflows without bypassing the Core write gate or lifecycle controls.

## Lifecycle

1. **Browser draft:** created or edited in an optional interface. It is device-local and non-canonical.
2. **Repository draft:** explicitly saved under `3.add-ons/skills/drafts/<name>/`. It is versioned but not installed.
3. **Experimental:** explicitly installed for testing and recorded in `3.add-ons/skills/register.md`.
4. **Adopted:** explicitly approved for regular use.
5. **Disabled, Uninstalled or Retired:** recorded as later lifecycle events without erasing earlier history.

Creating or downloading a draft never implies installation. Successful use never implies adoption.

## Canonical source copy

When a skill is generated or edited for the user, save its complete validated generic definition under `3.add-ons/skills/catalogue/<name>/` in the same authorised operation. Include `SKILL.md`, required references, scripts, assets and `manifest.json`. Preserve relative paths and keep the manifest name equal to the definition name.

Provider-specific manifests and discovery metadata are excluded from the generic source copy and belong under `1.plugins/<provider>/capabilities/<name>/`.

## Authoring

Capture the trigger, intended result, required inputs, ordered workflow, boundaries, approval points, examples, validation and any named dependencies. Keep the main definition concise; move detailed domain material to references, deterministic work to scripts and reusable output material to assets only when needed.

## Composition

- Dependencies must be explicit, installed and available.
- Self-dependencies, duplicates, missing dependencies and direct or indirect cycles are invalid.
- Only Adopted catalogue skills are offered for routine composition.
- Load only the dependency needed for the current step.
- Composition does not widen permissions or bypass any dependency's safeguards.

## Interface boundary

An interface may preview, download or copy a save request. It must not install a skill, write to the canonical repository or change the register directly. Installation and adoption require separate explicit instructions handled through the Core transaction rules.
