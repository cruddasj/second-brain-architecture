#!/usr/bin/env python3
"""Reproducible synthetic retrieval benchmark; no model or private data."""
import json
from pathlib import Path
import tempfile
from time import perf_counter

from retrieve import build_index, markdown, read_record, search
from test_retrieve import fixture, PROJECT


def main():
    with tempfile.TemporaryDirectory() as directory:
        repo = Path(directory)
        fixture(repo)
        start = perf_counter()
        cold = build_index(repo, 'main')
        cold_ms = (perf_counter() - start) * 1000
        start = perf_counter()
        warm = build_index(repo, 'main')
        warm_ms = (perf_counter() - start) * 1000
        cases = []
        for query in ('delivery next milestone', 'dispatch schedule', 'inspection approval'):
            start = perf_counter()
            found = search(warm, query)
            result = read_record(warm, PROJECT, 'next-milestone', expand=True)
            output = markdown(result)
            expected = ('2030-06-15', 'only after inspection approval', 'not guaranteed',
                        'Inspection approval is required.', 'supplier-agreement.md#delivery-conditions')
            passed = all(value in output for value in expected) and any(m['path'] == PROJECT for m in found['matches'])
            cases.append({'query': query, 'context_checks_passed': passed,
                          'search_and_read_ms': round((perf_counter() - start) * 1000, 3)})
        # Include search, citations and reference status in the measured output.
        baseline = sum(len(r['text']) for r in warm['records'].values())
        returned = len(markdown(found)) + len(output)
        report = {'synthetic_only': True, 'cold_ms': round(cold_ms, 3), 'warm_ms': round(warm_ms, 3),
                  'cold_files_read': cold['files_read'], 'warm_files_read': warm['files_read'],
                  'whole_record_characters': baseline, 'search_plus_context_characters': returned,
                  'character_reduction_percent': round(100 * (1 - returned / baseline), 1),
                  'approx_input_tokens_before': round(baseline / 4), 'approx_input_tokens_after': round(returned / 4),
                  'cases': cases,
                  'limits': 'Synthetic long-history fixture. Character/4 estimates are not tokenizer measurements. Times vary; no model answer quality or general percentage saving is claimed.'}
        print(json.dumps(report, indent=2))
        return 0 if all(c['context_checks_passed'] for c in cases) else 1


if __name__ == '__main__':
    raise SystemExit(main())
