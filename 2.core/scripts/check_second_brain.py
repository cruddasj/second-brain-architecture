#!/usr/bin/env python3
"""Validate the portable three-layer second-brain repository."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[2]
CORE = ROOT / "2.core"
PLUGINS = ROOT / "1.plugins"
ADDONS = ROOT / "3.add-ons"
INDEX = CORE / "index.md"
REPOSITORY_CONFIG = CORE / "system/repository-config.json"
RAW_SOURCES = CORE / "sources/raw"

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
    CORE / "system/source-control-policy.md",
    CORE / "system/theme-and-decision-policy.md",
    CORE / "system/activity-log.md",
    CORE / "system/source-register.md",
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
    PLUGINS / "portability-markers.json",
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
SECRET_PATTERNS = (
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
)
PORTABILITY_MARKER_REGISTER = PLUGINS / "portability-markers.json"
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
    text = path.read_text(encoding="utf-8")
    links: list[str] = []
    for match in LINK_PATTERN.finditer(text):
        target = match.group(1).strip().split("#", 1)[0]
        if target and not re.match(r"^[a-z][a-z0-9+.-]*:", target, re.I):
            links.append(unquote(target))
    return links


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


def configured_requirements(
    knowledge_categories: tuple[str, ...], required_theme_pages: tuple[str, ...]
) -> tuple[tuple[Path, ...], tuple[Path, ...]]:
    files = tuple(CORE / "themes" / name for name in required_theme_pages)
    dirs = tuple(CORE / "knowledge" / name for name in knowledge_categories)
    return files, dirs


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
                path in PORTABILITY_SCAN_EXCLUSIONS
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
                if marker in text:
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
                f"Provider metadata must be moved from add-on catalogue to plugins: {(folder / 'agents').relative_to(ROOT)}"
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
        if path.name not in ALLOWED_TOP_LEVEL and path.name not in IGNORED_TOP_LEVEL:
            errors.append(f"Unexpected top-level path outside the three-layer architecture: {path.name}")

    check_raw_source_formats(errors)
    check_contract_entry_points(errors)
    ai_provider_markers, add_on_platform_markers = load_portability_markers(errors)
    check_portable_layers(errors, ai_provider_markers, add_on_platform_markers)
    check_skill_catalogue(errors)
    check_legacy_capability_paths(errors)

    markdown_files = tracked_markdown()
    check_theme_link_reciprocity(errors, markdown_files)
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