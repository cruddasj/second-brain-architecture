"""Small, shared reader for the portable Markdown record conventions.

Preserves original section text. Supports ATX headings, fenced code, explicit
HTML anchors, inline links and reference links; it is not a Markdown renderer.
"""
from __future__ import annotations

import json
import re
from urllib.parse import unquote, urlsplit


def visible_lines(text: str) -> list[str]:
    """Blank code, comments and frontmatter without changing line positions."""
    lines = text.splitlines(keepends=True)
    result = []
    fence = None
    front = bool(lines and lines[0].strip() == '---')
    comment = False
    for i, line in enumerate(lines):
        if front:
            result.append('\n')
            if i and line.strip() == '---':
                front = False
            continue
        if '<!--' in line:
            comment = True
        if comment:
            result.append('\n')
            if '-->' in line:
                comment = False
            continue
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})', line)
        if marker:
            token = marker[1]
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence) and not line.strip()[len(token):].strip():
                fence = None
            result.append('\n')
        elif fence or line.startswith(('    ', '\t')):
            result.append('\n')
        else:
            result.append(line)
    return result


def metadata(text: str) -> dict:
    """Read scalar fields and inline alias lists, leaving other YAML untouched."""
    match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', text, re.S)
    result = {}
    if match:
        for line in match[1].splitlines():
            key, sep, value = line.partition(':')
            if sep and key and not key[0].isspace():
                value = value.strip()
                if value.startswith('[') and value.endswith(']'):
                    try:
                        value = json.loads(value)
                    except json.JSONDecodeError:
                        value = [part.strip().strip('\"\'') for part in value[1:-1].split(',') if part.strip()]
                else:
                    value = value.strip('\"\'')
                result[key] = value
    return result


def slug(title: str) -> str:
    title = re.sub(r'<[^>]+>', '', title)
    title = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', title)
    title = title.replace('`', '').lower()
    return re.sub(r'[^\w\- ]', '', title).replace(' ', '-')


def headings(text: str) -> list[dict]:
    found, used = [], set()
    for number, line in enumerate(visible_lines(text), 1):
        match = re.match(r'^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$', line)
        if match:
            base = slug(match[2])
            anchor, suffix = base, 0
            while anchor in used:
                suffix += 1
                anchor = f'{base}-{suffix}'
            used.add(anchor)
            found.append({'title': match[2], 'level': len(match[1]), 'anchor': anchor, 'line': number})
    return found


def anchors(text: str) -> set[str]:
    clean = ''.join(visible_lines(text))
    return {h['anchor'] for h in headings(text)} | set(re.findall(r'<a\s+(?:id|name)=[\"\']([^\"\']+)[\"\']', clean, re.I))


def sections(text: str) -> list[dict]:
    """H2 blocks include child headings and exact text; retain the preamble."""
    lines = text.splitlines(keepends=True)
    starts = [{'title': 'Preamble', 'anchor': '', 'line': 1}]
    starts += [h for h in headings(text) if h['level'] == 2]
    return [dict(h, text=''.join(lines[h['line'] - 1:(starts[i+1]['line'] - 1 if i+1 < len(starts) else len(lines))]))
            for i, h in enumerate(starts)]


def links(text: str, definition_source: str | None = None) -> list[str]:
    clean = ''.join(visible_lines(text))
    clean = re.sub(r'(`+).*?\1', '', clean)
    destinations = re.findall(r'(?<!!)\[[^]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[\"\'][^\n]*?[\"\'])?\s*\)', clean)
    definition_text = ''.join(visible_lines(definition_source)) if definition_source is not None else clean
    definitions = {m[0].strip().casefold(): m[1].strip('<>') for m in
                   re.findall(r'^ {0,3}\[([^]]+)\]:\s*(<[^>]+>|\S+)', definition_text, re.M)}
    for match in re.finditer(r'(?<!!)\[([^]\n]+)\](?:\[([^]\n]*)\])?(?![:(])', clean):
        key = (match[2] or match[1]).strip().casefold()
        if key in definitions:
            destinations.append(definitions[key])
    return list(dict.fromkeys(d.strip('<>') for d in destinations))


def local_target(destination: str) -> tuple[str, str] | None:
    parsed = urlsplit(destination)
    if parsed.scheme or parsed.netloc:
        return None
    return unquote(parsed.path), unquote(parsed.fragment)
