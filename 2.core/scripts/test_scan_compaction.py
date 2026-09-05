"""Synthetic fixtures for the read-only compaction candidate screen."""
from datetime import date
from pathlib import Path
import tempfile
import unittest

from scan_compaction import cutoff_date, main, scan


class CompactionScanTests(unittest.TestCase):
    def test_calendar_year_and_leap_day(self):
        self.assertEqual(cutoff_date(date(2024, 2, 29)), date(2023, 2, 28))
        self.assertEqual(cutoff_date(date(2025, 3, 1)), date(2024, 3, 1))

    def test_scope_cutoff_and_read_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = Path(tmp)
            (core / 'knowledge').mkdir()
            text = ('## Current state\n'
                    '- [event:ignored] (2020-01-01) Not in the event log\n'
                    '## Event log\n'
                    '- [event:first] (2024-09-05) Synthetic event\n'
                    '- [event:second] (2024-09-04) Another synthetic event\n'
                    '- [event:recent] (2024-09-06) Too recent\n')
            page = core / 'knowledge/example.md'
            page.write_text(text)
            (core / 'archive').mkdir()
            (core / 'archive/example.md').write_text(text)
            report = scan(core, date(2025, 9, 5))
            self.assertEqual(report['pages_inspected'], 1)
            self.assertEqual(len(report['candidates']), 1)
            self.assertEqual([x['id'] for x in report['candidates'][0]['events']], ['first', 'second'])
            self.assertEqual(page.read_text(), text)

    def test_examples_invalid_dates_and_unstructured_history(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = Path(tmp)
            (core / 'knowledge').mkdir()
            (core / 'knowledge/example.md').write_text(
                '## Event log\n```markdown\n'
                '- [event:example-one] (2020-01-01) Example\n```\n'
                '~~~markdown\n- [event:example-two] (2020-01-01) Example\n~~~\n'
                '- [event:bad] (2020-02-30) Invalid\n'
                'Unstructured historical paragraph.\n'
                '- [event:one] (2020-01-01) Only one real old event\n')
            report = scan(core, date(2025, 9, 5))
            self.assertEqual(report['candidates'], [])
            self.assertEqual(len(report['coverage_warnings']), 2)

    def test_missing_knowledge_is_failure_not_empty_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(main([tmp]), 1)

    def test_symlink_is_not_a_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = Path(tmp)
            (core / 'knowledge').mkdir()
            (core / 'outside.md').write_text('## Event log\n- [event:a] (2020-01-01) A\n- [event:b] (2020-01-01) B\n')
            (core / 'knowledge/linked.md').symlink_to(core / 'outside.md')
            report = scan(core, date(2025, 9, 5))
            self.assertEqual(report['candidates'], [])
            self.assertEqual(len(report['coverage_warnings']), 1)


if __name__ == '__main__':
    unittest.main()
