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

When a skill is generated or edited for the user, save its complete validated generic definition under `3.add-ons/skills/catalogue/<name>/` in the same authorised operation. Preserve relative paths and keep the manifest name equal to the definition name.

The generic catalogue package uses architecture-owned cross-provider packaging:

- `SKILL.md` contains the reusable workflow definition.
- `manifest.json` contains the generic lifecycle and dependency metadata.
- References, scripts and assets are included only when the generic workflow needs them.

These filenames standardise the portable repository source copy. They do not mean that a skill is installed in, discoverable by or executable through any particular provider.

Provider-specific manifests, discovery metadata, transformed installation layouts and provider-only instruction files are excluded from the generic source copy. They belong under `1.plugins/<plugin>/skills/<name>/` and should link back to the generic catalogue source rather than restating its workflow rules.

When generic skill content needs to identify a specific optional Plugin, use its immutable UUID from `1.plugins/plugin-registry.json` rather than a provider name or provider-specific path. The Plugin owns resolution from that UUID to its provider-specific discovery and installation details.

## Authoring

Capture the trigger, intended result, required inputs, ordered workflow, boundaries, approval points, examples, validation and any named dependencies. Keep the main definition concise; move detailed domain material to references, deterministic work to scripts and reusable output material to assets only when needed.

Keep workflow semantics provider-neutral. Cross-provider packaging conventions defined by the Add-on contract are allowed; provider-specific discovery, installation, activation and execution assumptions are not.

## Composition

- Dependencies must be explicit, installed and available.
- Self-dependencies, duplicates, missing dependencies and direct or indirect cycles are invalid.
- Only Adopted catalogue skills are offered for routine composition.
- Load only the dependency needed for the current step.
- Composition does not widen permissions or bypass any dependency's safeguards.

## Interface boundary

An interface may preview, download or copy a save request. It must not install a skill, write to the canonical repository or change the register directly. Installation and adoption require separate explicit instructions handled through the Core transaction rules.
