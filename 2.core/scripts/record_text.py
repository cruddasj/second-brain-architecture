"""Small, shared reader for the portable Markdown record conventions.

Preserves original section text. Supports ATX headings, fenced code, explicit
HTML anchors, inline links and reference links; it is not a Markdown renderer.
"""
from __future__ import annotations

import re
import posixpath
import unicodedata
from urllib.parse import unquote, urlsplit

from frontmatter import read_frontmatter


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
    """Read safe YAML metadata; strict field validation belongs to the validator."""
    try:
        return read_frontmatter(text) or {}
    except ValueError:
        return {}  # The validator reports malformed YAML; readers remain usable.


def slug(title: str) -> str:
    title = re.sub(r'<[^>]+>', '', title)
    title = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', title)
    title = re.sub(r'\[\[([^]|]+)(?:\|([^]]+))?\]\]', lambda m: m[2] or m[1], title)
    title = re.sub(r'[`*_~]', '', title).lower()
    title = ''.join(c for c in unicodedata.normalize('NFKD', title) if not '\u0300' <= c <= '\u036f')
    return re.sub(r'[^\w]+|_', '-', title).strip('-') or 'section'


def headings(text: str) -> list[dict]:
    found, used = [], set()
    for number, line in enumerate(visible_lines(text), 1):
        match = re.match(r'^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$', line)
        if match:
            explicit = re.search(r'\s+\{#([A-Za-z][\w:.-]*)\}\s*$', match[2])
            title = match[2][:explicit.start()].strip() if explicit else match[2]
            base = explicit[1] if explicit else slug(title)
            anchor, suffix = base, 1
            while anchor in used:
                suffix += 1
                anchor = f'{base}-{suffix}'
            used.add(anchor)
            found.append({'title': title, 'level': len(match[1]), 'anchor': anchor, 'line': number})
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
    wiki = re.findall(r'(?<![!\\])\[\[[^\]\n]+\]\]', clean)
    clean = re.sub(r'!?\[\[[^\]\n]+\]\]', '', clean)
    destinations = re.findall(r'(?<!!)\[[^]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[\"\'][^\n]*?[\"\'])?\s*\)', clean)
    definition_text = ''.join(visible_lines(definition_source)) if definition_source is not None else clean
    definitions = {m[0].strip().casefold(): m[1].strip('<>') for m in
                   re.findall(r'^ {0,3}\[([^]]+)\]:\s*(<[^>]+>|\S+)', definition_text, re.M)}
    for match in re.finditer(r'(?<!!)\[([^]\n]+)\](?:\[([^]\n]*)\])?(?![:(])', clean):
        key = (match[2] or match[1]).strip().casefold()
        if key in definitions:
            destinations.append(definitions[key])
    return list(dict.fromkeys([*(d.strip('<>') for d in destinations), *wiki]))


def local_target(destination: str) -> tuple[str, str] | None:
    if destination.startswith('[['):
        return None  # Wikilinks require the repository index, not a relative path guess.
    parsed = urlsplit(destination)
    if parsed.scheme or parsed.netloc:
        return None
    return unquote(parsed.path), unquote(parsed.fragment)


class LinkIndex:
    """Resolve wikilinks against a fixed, repository-relative Markdown snapshot."""
    def __init__(self, records: dict[str, str]):
        records = {path: text for path, text in records.items()
                   if path.endswith('.md') and not path.startswith('2.core/sources/raw/')}
        self.records = records
        self.names = {}
        for path, text in records.items():
            meta = metadata(text)
            aliases = meta.get('aliases', [])
            title = re.search(r'^#\s+(.+)$', text, re.M)
            names = [posixpath.basename(path).removesuffix('.md'), meta.get('title') or (title[1] if title else None)]
            names += aliases if isinstance(aliases, list) else []
            for name in names:
                if isinstance(name, str) and name.strip():
                    self.names.setdefault(unicodedata.normalize('NFC', name.strip()).lower(), set()).add(path)

    def resolve(self, current: str, destination: str) -> tuple[str, str] | None:
        if not destination.startswith('[['):
            target = local_target(destination)
            if not target:
                return None
            filename, fragment = target
            path = posixpath.normpath(posixpath.join(posixpath.dirname(current), filename)) if filename else current
            return path, fragment
        value = destination[2:-2].split('|', 1)[0].strip()
        if re.search(r'%(?![0-9a-fA-F]{2})', value):
            raise ValueError('Invalid wikilink encoding')
        value = unquote(value)
        name, _, fragment = value.partition('#')
        if re.search(r'[\x00-\x1f\\?:]', name) or name.startswith('//'):
            raise ValueError('Unsafe wikilink target')
        name = name.strip()
        if not name:
            candidates = {current} if fragment and current in self.records else set()
        elif '/' in name:
            filename = name if name.endswith('.md') else name + '.md'
            paths = [posixpath.normpath(filename.lstrip('/'))]
            if not name.startswith('/'):
                paths.append(posixpath.normpath(posixpath.join(posixpath.dirname(current), filename)))
            if any(p == '..' or p.startswith('../') for p in paths):
                # Relative ../ is valid only when it stays within the snapshot.
                paths = [p for p in paths if p != '..' and not p.startswith('../')]
            candidates = set(paths).intersection(self.records)
        else:
            key = unicodedata.normalize('NFC', name.removesuffix('.md')).lower()
            candidates = self.names.get(key, set())
        if len(candidates) != 1:
            raise ValueError('Ambiguous wikilink' if candidates else 'Unresolved wikilink')
        path = next(iter(candidates))
        if fragment:
            text = self.records[path]
            if fragment not in anchors(text):
                matches = [h for h in headings(text) if h['title'].strip().lower() == fragment.strip().lower()]
                if len(matches) != 1:
                    raise ValueError('Unresolved or ambiguous wikilink heading')
                fragment = matches[0]['anchor']
        return path, fragment
