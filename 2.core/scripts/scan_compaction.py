#!/usr/bin/env python3
"""List pages with at least two old structured events; never decide or write compaction."""
from __future__ import annotations

import argparse
from datetime import date
import json
from pathlib import Path
import re
import sys

EVENT = re.compile(r'^- \[event:([a-z0-9][a-z0-9-]*)\]\s*\((\d{4}-\d{2}-\d{2})\)')
FENCE = re.compile(r'^\s*(`{3,}|~{3,})')


def cutoff_date(as_of: date) -> date:
    """Twelve calendar months earlier, clamping leap day to February's end."""
    try:
        return as_of.replace(year=as_of.year - 1)
    except ValueError:
        return as_of.replace(year=as_of.year - 1, day=28)


def scan(core: Path, as_of: date) -> dict:
    knowledge = core / 'knowledge'
    if not knowledge.is_dir():
        raise ValueError('Core knowledge directory is missing')
    cutoff = cutoff_date(as_of)
    candidates = []
    warnings = []
    inspected = 0
    for path in sorted(knowledge.rglob('*.md')):
        # Do not traverse linked files or linked ancestors outside the knowledge tree.
        if path.is_symlink() or any(p.is_symlink() for p in path.parents if p != core.parent):
            warnings.append(f'Skipped symbolic link: {path.relative_to(core)}')
            continue
        inspected += 1
        old_events = []
        in_events = False
        fence = None
        for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
            marker = FENCE.match(line)
            if marker:
                token = marker.group(1)
                if fence is None:
                    fence = token
                elif token[0] == fence[0] and len(token) >= len(fence) and not line.strip()[len(token):].strip():
                    fence = None
                continue
            if fence is not None:
                continue
            if line.startswith('## '):
                in_events = line.strip() == '## Event log'
                continue
            if not in_events or not line.strip():
                continue
            match = EVENT.match(line)
            if match:
                try:
                    happened = date.fromisoformat(match.group(2))
                except ValueError:
                    warnings.append(f'Invalid event date: {path.relative_to(core)}:{number}')
                    continue
                if happened <= cutoff:
                    old_events.append({'id': match.group(1), 'date': happened.isoformat(), 'line': number})
            elif not line.startswith((' ', '\t', '#')):
                warnings.append(f'Unstructured event text not assessed: {path.relative_to(core)}:{number}')
        if len(old_events) >= 2:
            candidates.append({'path': path.relative_to(core).as_posix(), 'events': old_events})
    return {
        'as_of': as_of.isoformat(), 'cutoff': cutoff.isoformat(),
        'pages_inspected': inspected, 'candidates': candidates,
        'coverage_warnings': warnings,
        'limits': 'Only structured dated entries under Event log are screened. Age and count do not establish repetition, a closed period, agreement or eligibility. Semantic review must check every compaction gate. Unstructured history needs a separate explicit review.',
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('core', nargs='?', default='2.core')
    parser.add_argument('--as-of', type=date.fromisoformat, default=date.today())
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args(argv)
    try:
        report = scan(Path(args.core), args.as_of)
    except (OSError, ValueError) as error:
        print(f'Compaction scan failed: {error}', file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Compaction candidates: {len(report['candidates'])}; pages inspected: {report['pages_inspected']}; cutoff: {report['cutoff']}")
        for candidate in report['candidates']:
            print(f"- {candidate['path']}: {len(candidate['events'])} old events")
        for warning in report['coverage_warnings']:
            print(f'Warning: {warning}')
        print(report['limits'])
    return 0


if __name__ == '__main__':
    sys.exit(main())
