#!/usr/bin/env python3
"""Validate the portable three-layer second-brain repository."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

import record_text


ROOT = Path(__file__).resolve().parents[2]
CORE = ROOT / "2.core"
PLUGINS = ROOT / "1.plugins"
ADDONS = ROOT / "3.add-ons"
INDEX = CORE / "index.md"
REPOSITORY_CONFIG = CORE / "system/repository-config.json"
RAW_SOURCES = CORE / "sources/raw"
SOURCE_NOTES = CORE / "sources/notes"
PLUGIN_REGISTRY = PLUGINS / "plugin-registry.json"

ARCHITECTURE_REQUIRED_FILES = (
    ROOT / "README.md",
    ROOT / "AGENTS.md",
    ROOT / "LICENSE.md",
    CORE / "README.md",
    CORE / "AGENTS.md",
    CORE / "CONTRACT.md",
    CORE / "docs/research.md",
    INDEX,
    CORE / "memory/core.md",
    CORE / "system/directory.md",
    CORE / "system/operating-rules.md",
    CORE / "system/freshness-policy.md",
    CORE / "system/freshness-audit-task.md",
    CORE / "system/theme-review-task.md",
    CORE / "system/integration-design-policy.md",
    CORE / "system/public-release-policy.md",
    CORE / "scripts/scan_compaction.py",
    CORE / "scripts/test_scan_compaction.py",
    CORE / "system/source-control-policy.md",
    CORE / "system/theme-and-decision-policy.md",
    CORE / "system/activity-log.md",
    CORE / "system/source-register.md",
    CORE / "system/source-reference-policy.md",
    REPOSITORY_CONFIG,
    CORE / "themes/index.md",
    CORE / "templates/decision-record.md",
    CORE / "scripts/check_second_brain.py",
    CORE / "scripts/audit_freshness.py",
    CORE / "scripts/test_audit_freshness.py",
    CORE / "scripts/test_check_second_brain.py",
    PLUGINS / "README.md",
    PLUGINS / "AGENTS.md",
    PLUGINS / "CONTRACT.md",
    PLUGINS / "plugin-registry.json",
    PLUGINS / "portability-markers.json",
    PLUGINS / "root-shims.json",
    ADDONS / "README.md",
    ADDONS / "AGENTS.md",
    ADDONS / "CONTRACT.md",
)
ARCHITECTURE_REQUIRED_DIRS = (
    "assets/images",
    "2.core/memory",
    "2.core/knowledge",
    "2.core/sources/raw",
    "2.core/sources/notes",
    "2.core/themes",
    "2.core/archive",
    "1.plugins",
    "3.add-ons",
)
ALLOWED_TOP_LEVEL = {
    ".git",
    ".github",
    ".gitignore",
    "README.md",
    "AGENTS.md",
    "LICENSE.md",
    "assets",
    "1.plugins",
    "2.core",
    "3.add-ons",
}
IGNORED_TOP_LEVEL = {
    ".next",
    ".sites-runtime",
    "dist",
    "node_modules",
}
EXCLUDED_PARTS = {
    ".git",
    ".next",
    ".sites-runtime",
    ".wrangler",
    "dist",
    "node_modules",
    "outputs",
}
ALLOWED_RAW_SOURCE_SUFFIXES = {".txt", ".rtf", ".md"}
LINK_PATTERN = re.compile(r"(?<!!)\[[^]]+\]\(([^)]+)\)")
ENTRY_PATTERN = re.compile(r"^- \[(state|event):([a-z0-9][a-z0-9-]*)\](.*)$")
DATE_PATTERN = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
CATEGORY_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")
THEME_PAGE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*\.md$")
PLUGIN_PATH_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")
UUID4_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
SOURCE_FIELD_PATTERN = re.compile(r"^- ([A-Za-z][A-Za-z ]*):\s*(.*?)\s*$", re.MULTILINE)
SECRET_PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
)
PORTABILITY_MARKER_REGISTER = PLUGINS / "portability-markers.json"
ROOT_SHIM_REGISTER = PLUGINS / "root-shims.json"
PORTABILITY_SCAN_SUFFIXES = {
    ".md",
    ".json",
    ".js",
    ".mjs",
    ".ts",
    ".tsx",
    ".py",
    ".sh",
    ".yaml",
    ".yml",
}
PORTABILITY_SCAN_EXCLUSIONS = {
    CORE / "system/activity-log.md",
}
CORE_PORTABILITY_SCAN_ROOTS = (
    CORE / "README.md",
    CORE / "AGENTS.md",
    CORE / "CONTRACT.md",
    CORE / "system",
    CORE / "templates",
    CORE / "docs",
)


def has_frontmatter(path: Path) -> bool:
    lines = path.read_text(encoding="utf-8").splitlines()
    return len(lines) >= 3 and lines[0].strip() == "---" and "---" in lines[1:]


def is_raw_source(path: Path) -> bool:
    try:
        path.resolve().relative_to(RAW_SOURCES.resolve())
    except ValueError:
        return False
    return True


def local_links(path: Path) -> list[str]:
    return [target[0] for destination in record_text.links(path.read_text(encoding="utf-8"))
            if (target := record_text.local_target(destination)) and target[0]]


def check_record_links(errors: list[str], markdown_files: list[Path]) -> None:
    """Check precise record links, identity uniqueness and direct backlinks."""
    identities: dict[str, Path] = {}
    texts = {p.resolve(): p.read_text(encoding="utf-8") for p in markdown_files}
    knowledge = (CORE / "knowledge").resolve()
    memory = (CORE / "memory").resolve()
    source_notes = (CORE / "sources/notes").resolve()
    def authoritative(p: Path) -> bool:
        return p.is_relative_to(knowledge) or p.is_relative_to(memory)
    for path, text in texts.items():
        is_record = authoritative(path) or path.is_relative_to(source_notes)
        if not is_record:
            continue
        record_id = record_text.metadata(text).get("record_id")
        if record_id:
            if not isinstance(record_id, str) or not UUID4_PATTERN.fullmatch(record_id):
                errors.append(f"Invalid record_id: {path.relative_to(ROOT)}")
            elif record_id in identities:
                errors.append(f"Duplicate record_id: {path.relative_to(ROOT)} and {identities[record_id].relative_to(ROOT)}")
            else:
                identities[record_id] = path
        for destination in record_text.links(text):
            target = record_text.local_target(destination)
            if not target:
                continue
            filename, fragment = target
            resolved = (path.parent / filename).resolve() if filename else path
            if fragment and resolved in texts and fragment not in record_text.anchors(texts[resolved]):
                errors.append(f"Broken record anchor: {path.relative_to(ROOT)} -> {destination}")
        if not authoritative(path):
            continue
        related = [s for s in record_text.sections(text) if s['title'] == 'Related records']
        for section in related:
            for destination in record_text.links(section['text'], text):
                target = record_text.local_target(destination)
                resolved = (path.parent / target[0]).resolve() if target and target[0] else path
                if not target or not authoritative(resolved) or resolved == path:
                    errors.append(f"Related records target is not another authoritative record: {path.relative_to(ROOT)} -> {destination}")
                    continue
                if resolved not in texts:
                    continue  # Missing files are reported by the normal link check.
                backlinks = set()
                for other in record_text.sections(texts[resolved]):
                    if other['title'] == 'Related records':
                        for link in record_text.links(other['text'], texts[resolved]):
                            back = record_text.local_target(link)
                            if back and back[0]:
                                backlinks.add((resolved.parent / back[0]).resolve())
                if path not in backlinks:
                    errors.append(f"Related records link is not reciprocal: {path.relative_to(ROOT)} -> {destination}")


def resolved_local_links(path: Path) -> set[Path]:
    return {(path.parent / target).resolve() for target in local_links(path)}


def check_theme_link_reciprocity(
    errors: list[str], markdown_files: list[Path]
) -> None:
    theme_root = (CORE / "themes").resolve()
    knowledge_root = (CORE / "knowledge").resolve()

    for path in markdown_files:
        source = path.resolve()
        if source.is_relative_to(theme_root) and path.name != "index.md":
            counterpart_root = knowledge_root
        elif source.is_relative_to(knowledge_root):
            counterpart_root = theme_root
        else:
            continue

        for target in resolved_local_links(path):
            if (
                not target.is_file()
                or not target.is_relative_to(counterpart_root)
                or target == theme_root / "index.md"
            ):
                continue
            if source not in resolved_local_links(target):
                errors.append(
                    "Theme link is not reciprocal: "
                    f"{path.relative_to(ROOT)} -> {target.relative_to(ROOT)}"
                )


def memory_entries(text: str) -> list[tuple[str, str, int, str]]:
    """Return non-example state and event entries with their indented metadata."""
    lines = text.splitlines()
    entries: list[tuple[str, str, int, str]] = []
    in_fence = False

    for index, line in enumerate(lines):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        match = ENTRY_PATTERN.match(line)
        if not match:
            continue

        block = [line]
        cursor = index + 1
        while cursor < len(lines):
            following = lines[cursor]
            if following.startswith("  ") or not following.strip():
                block.append(following)
                cursor += 1
                continue
            break
        entries.append((match.group(1), match.group(2), index + 1, "\n".join(block)))

    return entries


def tracked_markdown() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*.md")
        if not EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts)
        and not is_raw_source(path)
    )


def parse_repository_config(
    data: object, errors: list[str]
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    if not isinstance(data, dict):
        errors.append("Repository config must be a JSON object")
        return (), ()

    categories = data.get("knowledge_categories")
    themes = data.get("required_theme_pages")

    if not isinstance(categories, list) or any(
        not isinstance(value, str) or not CATEGORY_PATTERN.fullmatch(value)
        for value in categories
    ):
        errors.append(
            "Repository config field 'knowledge_categories' must be an array of kebab-case names"
        )
        parsed_categories: tuple[str, ...] = ()
    else:
        parsed_categories = tuple(categories)
        if len(set(parsed_categories)) != len(parsed_categories):
            errors.append("Repository config field 'knowledge_categories' has duplicates")

    if not isinstance(themes, list) or any(
        not isinstance(value, str) or not THEME_PAGE_PATTERN.fullmatch(value)
        for value in themes
    ):
        errors.append(
            "Repository config field 'required_theme_pages' must be an array of kebab-case Markdown filenames"
        )
        parsed_themes: tuple[str, ...] = ()
    else:
        parsed_themes = tuple(themes)
        if len(set(parsed_themes)) != len(parsed_themes):
            errors.append("Repository config field 'required_theme_pages' has duplicates")

    return parsed_categories, parsed_themes


def load_repository_config(errors: list[str]) -> tuple[tuple[str, ...], tuple[str, ...]]:
    if not REPOSITORY_CONFIG.is_file():
        return (), ()
    try:
        data = json.loads(REPOSITORY_CONFIG.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        errors.append(f"Invalid repository config: {error}")
        return (), ()
    return parse_repository_config(data, errors)


def parse_plugin_registry(data: object, errors: list[str]) -> dict[str, str]:
    if not isinstance(data, dict):
        errors.append("Plugin registry must be a JSON object")
        return {}

    entries = data.get("plugins")
    if not isinstance(entries, list):
        errors.append("Plugin registry field 'plugins' must be an array")
        return {}

    parsed: dict[str, str] = {}
    paths: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append("Each Plugin registry entry must be a JSON object")
            continue

        plugin_id = entry.get("id")
        path = entry.get("path")
        if not isinstance(plugin_id, str) or not UUID4_PATTERN.fullmatch(plugin_id):
            errors.append(f"Plugin registry ID must be a lowercase UUIDv4: {plugin_id!r}")
            continue
        if not isinstance(path, str) or not PLUGIN_PATH_PATTERN.fullmatch(path):
            errors.append(f"Plugin registry path must be one Plugin directory name: {path!r}")
            continue
        if plugin_id in parsed:
            errors.append(f"Duplicate Plugin registry ID: {plugin_id}")
            continue
        if path in paths:
            errors.append(f"Duplicate Plugin registry path: {path}")
            continue
        parsed[plugin_id] = path
        paths.add(path)

    return parsed


def load_plugin_registry(errors: list[str]) -> dict[str, str]:
    if not PLUGIN_REGISTRY.is_file():
        return {}
    try:
        data = json.loads(PLUGIN_REGISTRY.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        errors.append(f"Invalid Plugin registry: {error}")
        return {}
    return parse_plugin_registry(data, errors)


def check_plugin_registry(errors: list[str], registry: dict[str, str]) -> None:
    registered_paths = set(registry.values())
    plugin_paths = {
        path.name
        for path in PLUGINS.iterdir()
        if path.is_dir() and (path / "README.md").is_file()
    }

    for path in sorted(registered_paths - plugin_paths):
        errors.append(f"Plugin registry references missing Plugin directory: {path}")
    for path in sorted(plugin_paths - registered_paths):
        errors.append(f"Plugin directory is not registered: {path}")

    for plugin_id, path in registry.items():
        readme = PLUGINS / path / "README.md"
        if readme.is_file() and plugin_id not in readme.read_text(encoding="utf-8"):
            errors.append(f"Plugin README does not declare registered ID: {path}")


def source_fields(text: str) -> dict[str, str]:
    return {
        key.strip().lower(): value.strip()
        for key, value in SOURCE_FIELD_PATTERN.findall(text)
    }


def check_source_note_references(
    errors: list[str],
    registry: dict[str, str],
    source_root: Path = SOURCE_NOTES,
) -> None:
    if not source_root.is_dir():
        return

    for path in sorted(source_root.rglob("*.md")):
        fields = source_fields(path.read_text(encoding="utf-8"))
        kind = fields.get("source kind", "").lower()
        try:
            relative = path.relative_to(ROOT)
        except ValueError:
            relative = path

        if kind == "direct":
            if not fields.get("original source"):
                errors.append(f"Direct source note missing Original source: {relative}")
            if fields.get("plugin id") or fields.get("plugin provider resource id"):
                errors.append(f"Direct source note contains Plugin reference fields: {relative}")
        elif kind == "plugin":
            plugin_id = fields.get("plugin id", "")
            resource_id = fields.get("plugin provider resource id", "")
            if plugin_id not in registry:
                errors.append(f"Plugin source note has unknown Plugin ID: {relative}")
            if not resource_id:
                errors.append(
                    f"Plugin source note missing Plugin provider resource ID: {relative}"
                )
            if fields.get("original source"):
                errors.append(
                    f"Plugin source note must not contain Original source: {relative}"
                )
        else:
            errors.append(f"Source note has invalid or missing Source kind: {relative}")


def configured_requirements(
    knowledge_categories: tuple[str, ...], required_theme_pages: tuple[str, ...]
) -> tuple[tuple[Path, ...], tuple[Path, ...]]:
    files = tuple(CORE / "themes" / name for name in required_theme_pages)
    dirs = tuple(CORE / "knowledge" / name for name in knowledge_categories)
    return files, dirs


def parse_root_shims(
    data: object, errors: list[str]
) -> dict[str, tuple[str, str]]:
    if not isinstance(data, dict):
        errors.append("Root-shim register must be a JSON object")
        return {}

    entries = data.get("root_shims")
    if not isinstance(entries, list):
        errors.append("Root-shim register field 'root_shims' must be an array")
        return {}

    parsed: dict[str, tuple[str, str]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append("Each root-shim entry must be a JSON object")
            continue

        path = entry.get("path")
        plugin = entry.get("plugin")
        exact_content = entry.get("exact_content")
        if not all(isinstance(value, str) and value for value in (path, plugin, exact_content)):
            errors.append(
                "Each root-shim entry requires non-empty path, plugin and exact_content strings"
            )
            continue
        if "/" in path or "\\" in path or not path.lower().endswith(".md"):
            errors.append(f"Root shim must be a root-level Markdown file: {path!r}")
            continue
        if "/" in plugin or "\\" in plugin or plugin in {".", ".."}:
            errors.append(f"Root-shim plugin must be one plugin directory name: {plugin!r}")
            continue
        if path in parsed:
            errors.append(f"Duplicate root-shim path: {path}")
            continue
        parsed[path] = (plugin, exact_content)

    return parsed


def load_root_shims(errors: list[str]) -> dict[str, tuple[str, str]]:
    if not ROOT_SHIM_REGISTER.is_file():
        return {}
    try:
        data = json.loads(ROOT_SHIM_REGISTER.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        errors.append(f"Invalid root-shim register: {error}")
        return {}
    return parse_root_shims(data, errors)


def check_root_shims(
    errors: list[str], root_shims: dict[str, tuple[str, str]]
) -> None:
    for filename, (plugin, exact_content) in root_shims.items():
        plugin_dir = PLUGINS / plugin
        if not plugin_dir.is_dir():
            errors.append(f"Root shim {filename} references missing Plugin directory: {plugin}")

        path = ROOT / filename
        if not path.is_file():
            errors.append(f"Missing registered root shim: {filename}")
            continue
        try:
            actual = path.read_text(encoding="utf-8")
        except OSError as error:
            errors.append(f"Cannot read registered root shim {filename}: {error}")
            continue
        if actual != exact_content:
            errors.append(
                f"Root shim {filename} must contain only its registered compatibility pointer"
            )


def check_raw_source_formats(errors: list[str], raw_root: Path = RAW_SOURCES) -> None:
    if not raw_root.is_dir():
        return
    for path in sorted(raw_root.rglob("*")):
        if not path.is_file() or path.name == ".gitkeep":
            continue
        if path.suffix.lower() not in ALLOWED_RAW_SOURCE_SUFFIXES:
            try:
                relative = path.relative_to(ROOT)
            except ValueError:
                relative = path
            allowed = ", ".join(sorted(ALLOWED_RAW_SOURCE_SUFFIXES))
            errors.append(
                f"Unsupported raw source format: {relative} (allowed: {allowed})"
            )


def check_contract_entry_points(errors: list[str]) -> None:
    for layer in (CORE, PLUGINS, ADDONS):
        for name in ("README.md", "AGENTS.md"):
            path = layer / name
            if path.is_file() and "(CONTRACT.md)" not in path.read_text(encoding="utf-8"):
                errors.append(
                    f"{path.relative_to(ROOT)} must link directly to its shared CONTRACT.md"
                )

    root_expectations = {
        ROOT / "AGENTS.md": "(2.core/AGENTS.md)",
    }
    for path, marker in root_expectations.items():
        if path.is_file() and marker not in path.read_text(encoding="utf-8"):
            errors.append(f"{path.name} is not a thin pointer to {marker[1:-1]}")


def load_portability_markers(errors: list[str]) -> tuple[tuple[str, ...], tuple[str, ...]]:
    if not PORTABILITY_MARKER_REGISTER.is_file():
        return (), ()

    try:
        register = json.loads(PORTABILITY_MARKER_REGISTER.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as error:
        errors.append(f"Invalid portability marker register: {error}")
        return (), ()

    marker_groups: list[tuple[str, ...]] = []
    for key in ("ai_provider_markers", "add_on_platform_markers"):
        values = register.get(key)
        if not isinstance(values, list) or not values or any(
            not isinstance(value, str) or not value.strip() for value in values
        ):
            errors.append(
                f"Portability marker register field {key!r} must be a non-empty string array"
            )
            marker_groups.append(())
            continue
        normalised = tuple(value.strip().lower() for value in values)
        if len(set(normalised)) != len(normalised):
            errors.append(f"Portability marker register field {key!r} has duplicates")
        marker_groups.append(normalised)

    return marker_groups[0], marker_groups[1]


def text_has_portability_marker(text: str, marker: str) -> bool:
    marker = marker.strip().lower()
    if not marker:
        return False
    if re.fullmatch(r"[a-z0-9]+(?:[ -][a-z0-9]+)*", marker):
        return re.search(
            rf"(?<![a-z0-9]){re.escape(marker)}(?![a-z0-9])", text
        ) is not None
    return marker in text


def is_portability_scanned_path(path: Path, layer: Path) -> bool:
    if layer != CORE:
        return True
    return any(
        path == scan_root or path.is_relative_to(scan_root)
        for scan_root in CORE_PORTABILITY_SCAN_ROOTS
    )


def check_portable_layers(
    errors: list[str],
    ai_provider_markers: tuple[str, ...],
    add_on_platform_markers: tuple[str, ...],
) -> None:
    for layer, label in ((CORE, "Core"), (ADDONS, "add-on")):
        if not layer.is_dir():
            continue

        markers = ai_provider_markers
        if layer == ADDONS:
            markers += add_on_platform_markers

        for path in layer.rglob("*"):
            relative = path.relative_to(ROOT)
            if (
                not is_portability_scanned_path(path, layer)
                or path in PORTABILITY_SCAN_EXCLUSIONS
                or is_raw_source(path)
                or EXCLUDED_PARTS.intersection(relative.parts)
            ):
                continue

            lowered_parts = [
                part.lower().lstrip(".") for part in path.relative_to(layer).parts
            ]
            for marker in markers:
                clean_marker = marker.strip("/.").lower()
                if clean_marker and any(clean_marker == part for part in lowered_parts):
                    errors.append(
                        f"Provider-specific path in {label} layer: {relative}"
                    )

            if (
                not path.is_file()
                or path.name in {"package-lock.json", "brain-data.json"}
                or path.suffix.lower() not in PORTABILITY_SCAN_SUFFIXES
            ):
                continue
            text = path.read_text(encoding="utf-8", errors="ignore").lower()
            for marker in markers:
                if text_has_portability_marker(text, marker):
                    errors.append(
                        f"Provider-specific marker '{marker}' in {label} file: {relative}"
                    )


def check_skill_catalogue(errors: list[str]) -> None:
    catalogue = ADDONS / "skills/catalogue"
    if not catalogue.is_dir():
        return

    manifests: dict[str, list[str]] = {}
    for folder in sorted(path for path in catalogue.iterdir() if path.is_dir()):
        manifest_path = folder / "manifest.json"
        definition_path = folder / "SKILL.md"
        if not manifest_path.is_file():
            errors.append(f"Skill missing manifest.json: {folder.relative_to(ROOT)}")
            continue
        if not definition_path.is_file():
            errors.append(f"Skill missing SKILL.md: {folder.relative_to(ROOT)}")
        if (folder / "agents").exists():
            errors.append(
                "Provider metadata must be moved from add-on catalogue to plugins: "
                f"{(folder / 'agents').relative_to(ROOT)}"
            )
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as error:
            errors.append(f"Invalid skill manifest {manifest_path.relative_to(ROOT)}: {error}")
            continue

        name = manifest.get("name")
        uses = manifest.get("uses")
        if name != folder.name:
            errors.append(
                f"Skill manifest name {name!r} does not match folder {folder.name!r}"
            )
        if not isinstance(uses, list) or any(not isinstance(item, str) for item in uses):
            errors.append(f"Skill uses must be a string array: {manifest_path.relative_to(ROOT)}")
            continue
        if len(set(uses)) != len(uses):
            errors.append(f"Skill has duplicate dependencies: {folder.name}")
        manifests[folder.name] = uses

    names = set(manifests)
    for name, dependencies in manifests.items():
        for dependency in dependencies:
            if dependency not in names:
                errors.append(f"Skill {name} depends on missing skill {dependency}")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(name: str, trail: list[str]) -> None:
        if name in visiting:
            errors.append(f"Skill dependency cycle: {' -> '.join([*trail, name])}")
            return
        if name in visited:
            return
        visiting.add(name)
        for dependency in manifests.get(name, []):
            if dependency in manifests:
                visit(dependency, [*trail, name])
        visiting.remove(name)
        visited.add(name)

    for name in sorted(manifests):
        visit(name, [])


def check_legacy_capability_paths(errors: list[str]) -> None:
    for path in PLUGINS.rglob("capabilities"):
        if path.is_dir():
            errors.append(
                "Legacy capability path must use skills terminology: "
                f"{path.relative_to(ROOT)}"
            )


def main() -> int:
    errors: list[str] = []
    state_locations: dict[str, list[Path]] = {}
    event_locations: dict[str, list[Path]] = {}

    knowledge_categories, required_theme_pages = load_repository_config(errors)
    configured_files, configured_dirs = configured_requirements(
        knowledge_categories, required_theme_pages
    )
    root_shims = load_root_shims(errors)
    plugin_registry = load_plugin_registry(errors)

    for path in (*ARCHITECTURE_REQUIRED_FILES, *configured_files):
        if not path.is_file():
            errors.append(f"Missing required file: {path.relative_to(ROOT)}")

    for relative in ARCHITECTURE_REQUIRED_DIRS:
        if not (ROOT / relative).is_dir():
            errors.append(f"Missing required directory: {relative}")
    for path in configured_dirs:
        if not path.is_dir():
            errors.append(f"Missing configured knowledge directory: {path.relative_to(ROOT)}")

    for path in ROOT.iterdir():
        if (
            path.name not in ALLOWED_TOP_LEVEL
            and path.name not in IGNORED_TOP_LEVEL
            and path.name not in root_shims
        ):
            errors.append(f"Unexpected top-level path outside the three-layer architecture: {path.name}")

    check_root_shims(errors, root_shims)
    check_plugin_registry(errors, plugin_registry)
    check_raw_source_formats(errors)
    check_source_note_references(errors, plugin_registry)
    check_contract_entry_points(errors)
    ai_provider_markers, add_on_platform_markers = load_portability_markers(errors)
    check_portable_layers(errors, ai_provider_markers, add_on_platform_markers)
    check_skill_catalogue(errors)
    check_legacy_capability_paths(errors)

    markdown_files = tracked_markdown()
    check_theme_link_reciprocity(errors, markdown_files)
    check_record_links(errors, markdown_files)
    index_text = INDEX.read_text(encoding="utf-8") if INDEX.exists() else ""

    for path in markdown_files:
        relative = path.relative_to(ROOT)

        if path.is_relative_to(CORE / "knowledge") or path.is_relative_to(CORE / "sources/notes"):
            if not has_frontmatter(path):
                errors.append(f"Missing YAML frontmatter: {relative}")
            core_relative = path.relative_to(CORE).as_posix()
            if path.name != ".gitkeep" and core_relative not in index_text:
                errors.append(f"Page not listed in 2.core/index.md: {core_relative}")

        if path.is_relative_to(CORE / "themes"):
            if not has_frontmatter(path):
                errors.append(f"Missing YAML frontmatter: {relative}")
            core_relative = path.relative_to(CORE).as_posix()
            if path.name != "index.md" and core_relative not in index_text:
                errors.append(f"Theme not listed in 2.core/index.md: {core_relative}")

        if path.is_relative_to(CORE / "knowledge"):
            text = path.read_text(encoding="utf-8")
            if "## Current state" not in text:
                errors.append(f"Missing Current state section: {relative}")
            if "## Event log" not in text:
                errors.append(f"Missing Event log section: {relative}")
            if re.search(r"^type:\s*decision\s*$", text, re.MULTILINE):
                for section in (
                    "## Question",
                    "## Options considered",
                    "## Decision",
                    "## Review plan",
                    "## Outcome review",
                ):
                    if section not in text:
                        errors.append(f"Decision record missing {section}: {relative}")

        if path == CORE / "memory/core.md":
            text = path.read_text(encoding="utf-8")
            if "## Current state" not in text:
                errors.append("2.core/memory/core.md is missing its Current state section")

        if path.is_relative_to(CORE / "knowledge") or path.is_relative_to(CORE / "memory"):
            text = path.read_text(encoding="utf-8")
            for kind, entry_id, line_number, block in memory_entries(text):
                location = Path(f"{relative}:{line_number}")
                if kind == "state":
                    state_locations.setdefault(entry_id, []).append(location)
                    for field in ("Effective:", "Last confirmed:", "Source:", "Transaction:"):
                        if field not in block:
                            errors.append(
                                f"State '{entry_id}' missing {field} at {relative}:{line_number}"
                            )
                else:
                    event_locations.setdefault(entry_id, []).append(location)
                    if not DATE_PATTERN.search(block.splitlines()[0]):
                        errors.append(f"Event '{entry_id}' missing date at {relative}:{line_number}")
                    for field in ("Source:", "Transaction:"):
                        if field not in block:
                            errors.append(
                                f"Event '{entry_id}' missing {field} at {relative}:{line_number}"
                            )

        for target in local_links(path):
            resolved = (path.parent / target).resolve()
            try:
                resolved.relative_to(ROOT.resolve())
            except ValueError:
                errors.append(f"Link leaves repository: {relative} -> {target}")
                continue
            if not resolved.exists():
                errors.append(f"Broken link: {relative} -> {target}")

    for state_id, locations in sorted(state_locations.items()):
        if len(locations) > 1:
            errors.append(
                f"Duplicate current state key '{state_id}': {', '.join(str(path) for path in locations)}"
            )

    for event_id, locations in sorted(event_locations.items()):
        if len(locations) > 1:
            errors.append(
                f"Duplicate event key '{event_id}': {', '.join(str(path) for path in locations)}"
            )

    for scan_root in (CORE, PLUGINS, ADDONS):
        for path in scan_root.rglob("*"):
            if (
                not path.is_file()
                or path.name == ".gitkeep"
                or EXCLUDED_PARTS.intersection(path.relative_to(ROOT).parts)
            ):
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            for pattern in SECRET_PATTERNS:
                if pattern.search(text):
                    errors.append(f"Possible secret in {path.relative_to(ROOT)}")

    if errors:
        print("Second-brain check failed:")
        for error in sorted(set(errors)):
            print(f"- {error}")
        return 1

    print(
        f"Second-brain check passed for {len(markdown_files)} Markdown files "
        "across Core, Plugins and Add-ons."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
