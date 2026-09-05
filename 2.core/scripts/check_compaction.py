#!/usr/bin/env python3
"""Check a revision-bound, line-complete compaction review map without writing."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

import record_text


def digest(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def event_lines(text: str) -> dict[int, str]:
    sections = [s for s in record_text.sections(text) if s['title'] == 'Event log']
    if len(sections) != 1:
        raise ValueError('Expected exactly one Event log section')
    section = sections[0]
    return {section['line'] + i: line.strip() for i, line in enumerate(section['text'].splitlines())
            if i and line.strip()}


def protected_values(text: str) -> set[str]:
    # Numeric values include dates, units, currency and signed amounts. This
    # deliberately conservative comparison does not decide semantic equivalence.
    pattern = r'(?:[£$€+-]?\d[\d,.:/-]*(?:\s?(?:%|[A-Za-z]+))?)|(?:\b(?:state|event):[a-z0-9-]+)|(?:\b[0-9a-f]{8}-[0-9a-f-]{27,}\b)'
    return set(re.findall(pattern, text))


def check(before: str, after: str, review: dict) -> dict:
    errors = []
    if review.get('before_sha256') != digest(before) or review.get('after_sha256') != digest(after):
        errors.append('Review hashes do not match the exact before and after files')
    if review.get('semantic_review') != 'confirmed':
        errors.append('Semantic review is pending; the checker cannot supply it')
    # Compaction cannot change other record sections, including context and links.
    old_other = [(s['title'], s['text']) for s in record_text.sections(before) if s['title'] != 'Event log']
    new_other = [(s['title'], s['text']) for s in record_text.sections(after) if s['title'] != 'Event log']
    # The page's updated date may change, but other frontmatter must be preserved.
    normal = lambda items: [(title, re.sub(r'(?m)^updated: .*$', 'updated: <date>', text)) for title, text in items]
    if normal(old_other) != normal(new_other):
        errors.append('Compaction changed content outside Event log')
    originals = event_lines(before)
    event_lines(after)  # Validate destination shape too.
    after_parts = record_text.sections(after)
    event_part = next(s for s in after_parts if s['title'] == 'Event log')
    event_text = event_part['text']
    after_headings = record_text.headings(after)
    maps = review.get('mappings', [])
    if not isinstance(maps, list):
        raise ValueError('mappings must be an array')
    covered = set()
    for mapping in maps:
        line = mapping.get('before_line')
        if not isinstance(line, int) or line not in originals or line in covered:
            errors.append(f'Invalid or duplicate before_line: {line}')
            continue
        covered.add(line)
        original = originals[line]
        if mapping.get('before_text') != original:
            errors.append(f'Original text mismatch at line {line}')
        target = mapping.get('target_anchor', '')
        found = [h for h in after_headings if h['anchor'] == target]
        if not found or found[0]['line'] < event_part['line']:
            errors.append(f'Missing event target anchor for line {line}')
            continue
        heading = found[0]
        end = next((h['line'] for h in after_headings if h['line'] > heading['line'] and h['level'] <= heading['level']), len(after.splitlines()) + 1)
        target_text = '\n'.join(after.splitlines()[heading['line']-1:end-1])
        if heading['line'] >= event_part['line'] + len(event_text.splitlines()):
            errors.append(f'Target outside Event log for line {line}')
        quote = mapping.get('after_text')
        if not isinstance(quote, str) or not quote.strip() or quote not in target_text:
            errors.append(f'Missing exact destination text for line {line}')
        if mapping.get('meaning') != 'equivalent' or not mapping.get('reason'):
            errors.append(f'Unreviewed meaning at line {line}')
        retained = mapping.get('retain', [])
        if not isinstance(retained, list) or not all(isinstance(s, str) and s for s in retained):
            errors.append(f'Invalid retained phrases at line {line}')
            retained = []
        for value in protected_values(original) | set(record_text.links(original)) | set(retained):
            if value not in target_text:
                errors.append(f'Lost value or protected phrase at line {line}: {value}')
    for line in originals.keys() - covered:
        errors.append(f'Unmapped original line: {line}')
    checks = review.get('checks', {})
    required = ('entities', 'conditions_and_exceptions', 'negation_and_uncertainty',
                'reasons_and_alternatives', 'sources_and_relationships', 'no_new_claims')
    for name in required:
        if not isinstance(checks.get(name), str) or not checks[name].strip():
            errors.append(f'Missing semantic review explanation: {name}')
    return {'status': 'failed' if errors else 'mechanical_checks_passed', 'errors': errors,
            'mapped_lines': len(covered), 'original_lines': len(originals),
            'notice': 'Mechanical coverage plus a recorded semantic assessment is not proof of lossless meaning. Eligibility, authority and source comparison still require review.'}


def prepare(before: str, after: str) -> dict:
    return {'before_sha256': digest(before), 'after_sha256': digest(after),
            'semantic_review': 'pending',
            'checks': {name: '' for name in ('entities', 'conditions_and_exceptions', 'negation_and_uncertainty',
                                            'reasons_and_alternatives', 'sources_and_relationships', 'no_new_claims')},
            'mappings': [{'before_line': line, 'before_text': text, 'target_anchor': '',
                          'after_text': '', 'retain': [], 'meaning': 'pending', 'reason': ''}
                         for line, text in event_lines(before).items()]}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('before', type=Path)
    parser.add_argument('after', type=Path)
    parser.add_argument('--review', type=Path, help='Completed JSON review map; omit to print a pending map')
    args = parser.parse_args(argv)
    try:
        before, after = args.before.read_text(encoding='utf-8'), args.after.read_text(encoding='utf-8')
        result = check(before, after, json.loads(args.review.read_text(encoding='utf-8'))) if args.review else prepare(before, after)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 1 if result.get('errors') else 0
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(f'Compaction check failed: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
