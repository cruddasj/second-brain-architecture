"""Synthetic Git repositories exercise the public retrieval interface."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from retrieve import build_index, read_record, search

PROJECT = '2.core/knowledge/projects/delivery-plan.md'
SUPPLIER = '2.core/knowledge/projects/supplier-agreement.md'
RECORD_ID = '550e8400-e29b-41d4-a716-446655440000'


def write(repo, path, text):
    target = repo / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')


def commit(repo, message='Synthetic fixture'):
    subprocess.run(['git', '-C', str(repo), 'add', '2.core', '.gitignore'], check=True, capture_output=True)
    subprocess.run(['git', '-C', str(repo), '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                    'commit', '-qm', message], check=True, capture_output=True)


def fixture(repo):
    subprocess.run(['git', 'init', '-q', '-b', 'main', str(repo)], check=True, capture_output=True)
    write(repo, '.gitignore', '.cache/\n')
    write(repo, PROJECT, f'---\ntitle: Delivery plan\nrecord_id: {RECORD_ID}\naliases: ["dispatch schedule"]\n---\n'
          '# Delivery plan\n## Purpose\nDeliver the synthetic sample.\n'
          '## Current state\n### Next milestone\nDelivery on 2030-06-15 only after inspection approval.\n'
          '## Uncertainty or contradictions\nApproval is pending; the date is not guaranteed.\n'
          '## Related records\nDepends on [supplier agreement](supplier-agreement.md#delivery-conditions).\n'
          '## Event log\n' + ''.join(f'- [event:sample-{i}] (2020-01-01) Historical sample inspection {i} recorded.\n' for i in range(250)))
    write(repo, SUPPLIER, '# Supplier agreement\n## Delivery conditions\nInspection approval is required.\n'
          '## Related records\nConstrains [delivery plan](delivery-plan.md).\n')
    write(repo, '2.core/archive/old.md', '# Archived\nRetired-only-value\n')
    write(repo, '2.core/sources/raw/raw.md', '# Raw\nRaw-only-value\n')
    commit(repo)


class RetrievalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        fixture(self.repo)

    def test_search_alias_and_record_identity(self):
        index = build_index(self.repo, 'main')
        result = search(index, 'dispatch schedule')
        self.assertEqual(result['matches'][0]['path'], PROJECT)
        self.assertEqual(read_record(index, RECORD_ID)['record'], PROJECT)

    def test_context_keeps_qualifications_and_lists_history(self):
        index = build_index(self.repo, 'main')
        result = read_record(index, PROJECT, 'next-milestone')
        body = ''.join(b['text'] for b in result['blocks'])
        self.assertIn('only after inspection approval', body)
        self.assertIn('not guaranteed', body)
        self.assertIn('supplier-agreement.md#delivery-conditions', body)
        self.assertNotIn('Historical sample inspection', body)
        self.assertEqual(result['omitted_sections'][0]['anchor'], 'event-log')

    def test_budget_refuses_partial_content(self):
        result = read_record(build_index(self.repo, 'main'), PROJECT, max_chars=10)
        self.assertEqual(result['status'], 'budget_exceeded')
        self.assertEqual(result['blocks'], [])
        self.assertGreater(result['required_chars'], 10)

    def test_history_can_be_explicitly_retrieved(self):
        result = read_record(build_index(self.repo, 'main'), PROJECT, 'event-log', max_chars=100000)
        self.assertIn('Historical sample inspection', ''.join(b['text'] for b in result['blocks']))
        self.assertEqual(result['omitted_sections'], [])

    def test_expansion_includes_dependency_without_cycle(self):
        result = read_record(build_index(self.repo, 'main'), PROJECT, expand=True)
        self.assertEqual(sum(b['path'] == SUPPLIER for b in result['blocks']), 1)
        self.assertIn('Inspection approval is required.', ''.join(b['text'] for b in result['blocks']))

    def test_snapshot_ignores_working_tree_and_cache_reuses_bodies(self):
        first = build_index(self.repo, 'main')
        write(self.repo, PROJECT, '# Uncommitted\nWrong answer\n')
        second = build_index(self.repo, 'main')
        self.assertEqual(second['files_read'], 0)
        self.assertEqual(first['revision'], second['revision'])
        self.assertNotIn('Wrong answer', second['records'][PROJECT]['text'])

    def test_changed_and_deleted_files_refresh(self):
        build_index(self.repo, 'main')
        write(self.repo, SUPPLIER, '# Revised supplier agreement\n')
        (self.repo / PROJECT).unlink()
        commit(self.repo, 'Revise synthetic evidence')
        result = build_index(self.repo, 'main')
        self.assertEqual(result['files_read'], 1)
        self.assertNotIn(PROJECT, result['records'])

    def test_cache_tampering_is_rejected_by_content_hash(self):
        build_index(self.repo, 'main')
        cache = self.repo / '3.add-ons/knowledge-retrieval/.cache/index.json'
        data = json.loads(cache.read_text())
        data['records'][PROJECT]['text'] = 'Tampered fact'
        cache.write_text(json.dumps(data))
        result = build_index(self.repo, 'main')
        self.assertEqual(result['files_read'], 1)
        self.assertNotIn('Tampered fact', result['records'][PROJECT]['text'])

    def test_archive_and_raw_are_excluded(self):
        result = build_index(self.repo, 'main', cache=False)
        self.assertEqual(len(result['records']), 2)
        self.assertFalse((self.repo / '3.add-ons/knowledge-retrieval/.cache').exists())

    def test_missing_section_is_an_error(self):
        with self.assertRaises(ValueError):
            read_record(build_index(self.repo, 'main'), PROJECT, 'nonexistent')

    def test_identity_survives_move_and_old_snapshot_still_resolves(self):
        before = build_index(self.repo, 'main')
        moved = '2.core/knowledge/projects/moved-plan.md'
        (self.repo / PROJECT).rename(self.repo / moved)
        commit(self.repo, 'Move synthetic record')
        current = build_index(self.repo, 'main')
        self.assertEqual(read_record(current, RECORD_ID)['record'], moved)
        self.assertEqual(read_record(build_index(self.repo, before['revision']), RECORD_ID)['record'], PROJECT)

    def test_cache_symlink_is_rejected_before_reading(self):
        path = self.repo / '3.add-ons/knowledge-retrieval'
        path.mkdir(parents=True)
        target = self.repo / 'other-cache'
        target.mkdir()
        (path / '.cache').symlink_to(target, target_is_directory=True)
        with self.assertRaises(ValueError):
            build_index(self.repo, 'main')
        self.assertEqual(list(target.iterdir()), [])

    def test_bad_dependency_anchor_is_reported(self):
        text = (self.repo / PROJECT).read_text().replace('#delivery-conditions', '#missing-conditions')
        write(self.repo, PROJECT, text)
        commit(self.repo)
        result = read_record(build_index(self.repo, 'main'), PROJECT, expand=True)
        self.assertTrue(any('Unresolved anchor' in w for w in result['warnings']))
        self.assertFalse(any(b['path'] == SUPPLIER for b in result['blocks']))

    def test_reference_definition_in_omitted_history_still_resolves(self):
        body = (self.repo / PROJECT).read_text().replace(
            '[supplier agreement](supplier-agreement.md#delivery-conditions)', '[supplier agreement][terms]')
        write(self.repo, PROJECT, body + '\n[terms]: supplier-agreement.md#delivery-conditions\n')
        commit(self.repo)
        result = read_record(build_index(self.repo, 'main'), PROJECT, expand=True)
        self.assertTrue(any(b['path'] == SUPPLIER for b in result['blocks']))
        self.assertEqual(result['references'][0]['link'], 'supplier-agreement.md#delivery-conditions')
        self.assertTrue(result['omitted_sections'])


if __name__ == '__main__':
    unittest.main()
