import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import check_second_brain as check
import record_text
from frontmatter import validate_frontmatter


class WikilinkTests(unittest.TestCase):
    def test_shared_resolution_contract(self):
        fixture = json.loads((Path(__file__).parent / 'fixtures/wikilinks.json').read_text(encoding='utf-8'))
        index = record_text.LinkIndex(fixture['records'])
        for case in fixture['cases']:
            with self.subTest(link=case['link']):
                if case['path'] is None:
                    with self.assertRaises(ValueError):
                        index.resolve(fixture['current'], case['link'])
                else:
                    self.assertEqual(index.resolve(fixture['current'], case['link']), (case['path'], case['heading']))

    def test_extraction_ignores_examples_embeds_and_escaped_links(self):
        text = '[[Real|label]] [Real](real.md)\n`[[Code]]`\n``[[Code2]]``\n~~~\n[[Fence]]\n~~~\n<!-- [[Comment]] -->\n    [[Indented]]\n![[Embed]] \\[[Escaped]]'
        self.assertEqual(record_text.links(text), ['real.md', '[[Real|label]]'])

    def test_wikilinks_participate_in_reciprocity_and_orphan_detection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            core = root / '2.core'
            folder = core / 'knowledge'
            folder.mkdir(parents=True)
            a, b, c = [folder / (name + '.md') for name in 'abc']
            a.write_text('# A\n## Related records\n[[B]]')
            b.write_text('# B\n## Related records\n[[A]]')
            c.write_text('# C\n[[C]]\n[External](https://example.invalid)')
            index = core / 'index.md'
            index.write_text('[C](knowledge/c.md)')
            files = [a, b, c, index]
            with patch.object(check, 'ROOT', root), patch.object(check, 'CORE', core):
                errors = []
                check.check_record_links(errors, files)
                self.assertEqual(errors, [])
                self.assertEqual(check.orphaned_notes(files, check.make_link_index(files)), [c])
                b.write_text('# B')
                check.check_record_links(errors, files)
                self.assertTrue(any('not reciprocal' in error for error in errors))
                # A one-way link still connects both notes.
                self.assertEqual(check.orphaned_notes(files, check.make_link_index(files)), [c])


class FrontmatterTests(unittest.TestCase):
    base = 'title: Example\ntype: knowledge\nupdated: 2026-01-15\n'

    def validate(self, fields):
        return validate_frontmatter('---\n' + fields + '---\n# Example\n', {'knowledge'})

    def test_existing_model_and_yaml_lists(self):
        self.assertEqual(self.validate(self.base), [])
        self.assertEqual(self.validate(self.base + 'aliases:\n  - "one, two"\n  - second\ndashboard: false\n'), [])
        self.assertEqual(self.validate(self.base + 'record_id: 550e8400-e29b-41d4-a716-446655440000\n'), [])

    def test_invalid_schema_and_yaml_fail(self):
        invalid = [self.base.replace('title: Example', 'title: 42'),
                   self.base.replace('title: Example', 'title: " "'),
                   self.base.replace('updated: 2026-01-15\n', ''),
                   self.base.replace('2026-01-15', '2026-02-30'),
                   self.base.replace('type: knowledge', 'type: source-note'),
                   self.base + 'title: Duplicate\n', self.base + 'unknown: value\n',
                   self.base + 'record_id: not-a-uuid\n', self.base + 'record_id: null\n',
                   self.base + 'aliases: one\n', self.base + 'aliases: [one, one]\n',
                   self.base + 'aliases: [1]\n', self.base + 'aliases: [\n',
                   self.base + 'dashboard: "false"\n', self.base + 'slug: example\n',
                   self.base + 'aliases: &names [one]\nextra: *names\n',
                   self.base + 'aliases: !!python/object:example {}\n']
        for fields in invalid:
            with self.subTest(fields=fields):
                self.assertTrue(self.validate(fields))
        self.assertTrue(validate_frontmatter('---\ntitle: never closed', {'knowledge'}))
        self.assertTrue(validate_frontmatter('---\n- not a mapping\n---\n', {'knowledge'}))


if __name__ == '__main__':
    unittest.main()
