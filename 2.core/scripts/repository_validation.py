"""Dependency-free configuration and raw-format rules shared by Core checks."""
import re

ALLOWED_RAW_SOURCE_SUFFIXES = {".txt", ".rtf", ".md"}
CATEGORY_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")
THEME_PAGE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*\.md$")
PLUGIN_PATH_PATTERN = re.compile(r"^[a-z0-9][a-z0-9-]*$")
UUID4_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
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


def plugin_readme_errors(text: str, plugin_id: str, path: str) -> list[str]:
    """Check the registered identity declaration without reading adapter files."""
    return [] if plugin_id in text else [f"Plugin README does not declare registered ID: {path}"]
