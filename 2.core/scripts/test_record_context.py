"""Synthetic regression cases for precise links and preservation checks."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import check_second_brain as validator
import check_compaction
import record_text


class RecordTextTests(unittest.TestCase):
    def test_heading_anchors_ignore_examples_and_disambiguate_duplicates(self):
        text = '# Record\n## Delivery conditions\n## Delivery conditions\n```\n## Hidden\n```\n~~~\n## Also hidden\n~~~\n<a id="stable"></a>\n'
        self.assertEqual(record_text.anchors(text), {'record', 'delivery-conditions', 'delivery-conditions-1', 'stable'})

    def test_reference_links_and_code_examples(self):
        text = '[Terms][t]\n[t]: terms.md#limits\n`[ignored](secret.md)`\n```\n[Example](missing.md)\n```\n'
        self.assertEqual(record_text.links(text), ['terms.md#limits'])

    def test_child_heading_stays_with_parent_and_text_is_exact(self):
        text = '# Record\n\n## Current state\n### Milestone\nDue only after approval.\n\n## Event log\nOld event.\n'
        part = record_text.sections(text)[1]
        self.assertIn('### Milestone\nDue only after approval.', part['text'])
        self.assertEqual(''.join(s['text'] for s in record_text.sections(text)), text)


class RecordLinkTests(unittest.TestCase):
    def run_check(self, left, right):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            records = root / '2.core/knowledge'
            records.mkdir(parents=True)
            a, b = records / 'a.md', records / 'b.md'
            a.write_text(left)
            b.write_text(right)
            with patch.object(validator, 'ROOT', root), patch.object(validator, 'CORE', root / '2.core'):
                errors = []
                validator.check_record_links(errors, [a, b])
                return errors

    def test_backlink_must_be_in_related_records(self):
        errors = self.run_check('# A\n## Related records\nDepends on [B](b.md#terms)\n',
                                '# B\n## Terms\nTest terms\n## Context\n[A](a.md)\n')
        self.assertTrue(any('not reciprocal' in e for e in errors))

    def test_reciprocal_precise_links_pass(self):
        self.assertEqual(self.run_check('# A\n## Related records\n[B](b.md#terms)\n',
                                       '# B\n## Terms\nTest terms\n## Related records\n[A](a.md)\n'), [])

    def test_missing_anchor_and_duplicate_id_fail(self):
        identity = '---\nrecord_id: 550e8400-e29b-41d4-a716-446655440000\n---\n'
        errors = self.run_check(identity + '# A\n[B](b.md#missing)\n', identity + '# B\n')
        self.assertTrue(any('Broken record anchor' in e for e in errors))
        self.assertTrue(any('Duplicate record_id' in e for e in errors))

    def test_ordinary_evidence_needs_no_backlink(self):
        self.assertEqual(self.run_check('# A\n## Sources\n[B](b.md)\n', '# B\n'), [])


class CompactionReviewTests(unittest.TestCase):
    before = '# Example\n## Current state\nUnchanged.\n## Event log\n- [event:first] (2020-01-01) Sample cost was 10 GBP only after approval.\n  - Source: [Evidence](source.md)\n  - Transaction: 550e8400-e29b-41d4-a716-446655440000\n\n## Context\nUnchanged context.\n'
    after = '# Example\n## Current state\nUnchanged.\n## Event log\n### Agreed outcome\nOn 2020-01-01, sample cost was 10 GBP only after approval.\nLineage: event:first; 550e8400-e29b-41d4-a716-446655440000.\nEvidence: [Evidence](source.md).\n\n## Context\nUnchanged context.\n'

    def review(self, after=None):
        after = after or self.after
        review = check_compaction.prepare(self.before, after)
        review['semantic_review'] = 'confirmed'
        review['checks'] = {k: 'Synthetic fixture: no distinct meaning changed.' for k in review['checks']}
        for mapping in review['mappings']:
            mapping.update(target_anchor='agreed-outcome', after_text='On 2020-01-01, sample cost was 10 GBP only after approval.',
                           meaning='equivalent', reason='Original synthetic fact and evidence preserved.')
            if mapping['before_line'] == 5:
                mapping['retain'] = ['only after approval']
        return review

    def test_complete_review_and_context_preservation(self):
        self.assertEqual(check_compaction.check(self.before, self.after, self.review())['errors'], [])

    def test_pending_review_cannot_pass(self):
        result = check_compaction.check(self.before, self.after, check_compaction.prepare(self.before, self.after))
        self.assertEqual(result['status'], 'failed')

    def test_missing_line_and_stale_hash_fail(self):
        review = self.review()
        review['mappings'].pop()
        review['after_sha256'] = 'stale'
        errors = check_compaction.check(self.before, self.after, review)['errors']
        self.assertTrue(any('hashes' in e for e in errors))
        self.assertTrue(any('Unmapped' in e for e in errors))

    def test_lost_qualification_and_source_are_rejected(self):
        after = self.after.replace(' only after approval', '').replace('[Evidence](source.md)', 'Evidence omitted')
        result = check_compaction.check(self.before, after, self.review(after))
        self.assertEqual(result['status'], 'failed')
        self.assertTrue(any('protected phrase' in e for e in result['errors']))

    def test_current_state_change_rejected_even_with_new_hash(self):
        after = self.after.replace('Unchanged.', 'Changed.')
        errors = check_compaction.check(self.before, after, self.review(after))['errors']
        self.assertIn('Compaction changed content outside Event log', errors)


if __name__ == '__main__':
    unittest.main()
