import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import check_second_brain as check


class ValidatorFixture:
    """Build the smallest repository tree that passes the main validator."""

    def __init__(self, root: Path):
        self.root = root
        self.core = root / "2.core"
        self.plugins = root / "1.plugins"
        self.addons = root / "3.add-ons"
        self._build()

    def write(self, relative: str, content: str = "fixture\n") -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def _build(self) -> None:
        for relative in (
            "assets/images",
            "2.core/memory",
            "2.core/knowledge",
            "2.core/sources/raw",
            "2.core/sources/notes",
            "2.core/themes",
            "2.core/archive",
            "2.core/templates",
            "2.core/docs",
            "2.core/scripts",
            "2.core/system",
            "1.plugins",
            "3.add-ons",
        ):
            (self.root / relative).mkdir(parents=True, exist_ok=True)

        self.write("README.md")
        self.write("AGENTS.md", "Root pointer (2.core/AGENTS.md)\n")
        self.write("LICENSE.md")

        self.write("2.core/README.md", "Contract marker (CONTRACT.md)\n")
        self.write("2.core/AGENTS.md", "Contract marker (CONTRACT.md)\n")
        self.write("2.core/CONTRACT.md")
        for path in ("system/theme-review-task.md", "system/integration-design-policy.md",
                     "system/public-release-policy.md", "scripts/scan_compaction.py",
                     "scripts/test_scan_compaction.py"):
            self.write("2.core/" + path)
        self.write("2.core/docs/research.md")
        self.write("2.core/index.md", "# Index\n")
        self.write("2.core/memory/core.md", "---\ntitle: Core memory\ntype: memory\nupdated: 2026-01-01\n---\n# Core memory\n\n## Current state\n")
        self.write("2.core/system/directory.md")
        self.write("2.core/system/operating-rules.md")
        self.write("2.core/system/freshness-policy.md")
        self.write("2.core/system/freshness-audit-task.md")
        self.write("2.core/system/source-control-policy.md")
        self.write("2.core/system/theme-and-decision-policy.md")
        self.write("2.core/system/activity-log.md")
        self.write("2.core/system/source-register.md")
        self.write("2.core/system/source-reference-policy.md")
        self.write(
            "2.core/system/repository-config.json",
            json.dumps(
                {
                    "knowledge_categories": [],
                    "required_theme_pages": [],
                }
            ),
        )
        self.write(
            "2.core/themes/index.md",
            "---\ntitle: Themes\ntype: index\nupdated: 2026-01-01\n---\n\n# Themes\n",
        )
        self.write("2.core/templates/decision-record.md")
        self.write(
            "2.core/scripts/check_second_brain.py",
            Path(check.__file__).read_text(encoding="utf-8"),
        )
        self.write("2.core/scripts/audit_freshness.py")
        self.write("2.core/scripts/record_text.py", Path(check.record_text.__file__).read_text(encoding="utf-8"))
        self.write("2.core/scripts/frontmatter.py", (Path(check.__file__).parent / 'frontmatter.py').read_text(encoding='utf-8'))
        self.write("2.core/scripts/test_audit_freshness.py")
        self.write("2.core/scripts/test_check_second_brain.py")

        self.write("1.plugins/README.md", "Contract marker (CONTRACT.md)\n")
        self.write("1.plugins/AGENTS.md", "Contract marker (CONTRACT.md)\n")
        self.write("1.plugins/CONTRACT.md")
        self.write("1.plugins/plugin-registry.json", json.dumps({"plugins": []}))
        self.write(
            "1.plugins/portability-markers.json",
            json.dumps(
                {
                    "ai_provider_markers": ["fixture-provider"],
                    "add_on_platform_markers": ["fixture-platform"],
                }
            ),
        )
        self.write("1.plugins/root-shims.json", json.dumps({"root_shims": []}))

        self.write("3.add-ons/README.md", "Contract marker (CONTRACT.md)\n")
        self.write("3.add-ons/AGENTS.md", "Contract marker (CONTRACT.md)\n")
        self.write("3.add-ons/CONTRACT.md")

    def add_knowledge(
        self,
        name: str,
        body: str,
        *,
        frontmatter: bool = True,
    ) -> Path:
        if frontmatter:
            content = (
                f"---\ntitle: {name}\ntype: knowledge\nupdated: 2026-01-01\n---\n\n"
                f"# {name}\n\n{body}\n"
            )
        else:
            content = f"# {name}\n\n{body}\n"

        path = self.write(f"2.core/knowledge/{name}.md", content)
        index = self.core / "index.md"
        index.write_text(
            index.read_text(encoding="utf-8") + f"\n- knowledge/{name}.md\n",
            encoding="utf-8",
        )
        return path

    def run(self, *args) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(self.core / "scripts/check_second_brain.py"), *args],
            cwd=self.root,
            capture_output=True,
            text=True,
            check=False,
        )


class ValidatorRepositoryFixtureTests(unittest.TestCase):
    TRANSACTION = "550e8400-e29b-41d4-a716-446655440000"

    def transaction_record(self, transaction=None):
        transaction = transaction or self.TRANSACTION
        return (
            "## Current state\n\n"
            "- [state:synthetic-status] Ready\n"
            "  - Effective: 2026-01-01\n"
            "  - Last confirmed: 2026-01-01\n"
            "  - Source: Synthetic fixture\n"
            f"  - Transaction: {transaction}\n\n"
            "## Event log\n\n"
            "- [event:synthetic-start] (2026-01-01) Started\n"
            "  - Source: Synthetic fixture\n"
            f"  - Transaction: {transaction}\n"
        )

    def transaction_log(self, transaction=None, paths="`2.core/knowledge/synthetic.md`",
                        commit="enclosing commit"):
        return (
            "## 2026-01-01 — Synthetic update\n"
            f"- Transaction: {transaction or self.TRANSACTION}\n"
            f"- Affected paths: {paths}\n"
            f"- Commit: {commit}\n"
        )

    def with_fixture(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        return ValidatorFixture(Path(temp_dir.name))

    def assert_failure_contains(self, fixture: ValidatorFixture, message: str) -> None:
        result = fixture.run()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn(message, result.stdout)

    def test_minimal_fixture_passes(self):
        fixture = self.with_fixture()
        result = fixture.run()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Second-brain check passed", result.stdout)

    def test_orphan_warning_and_optional_failure(self):
        fixture = self.with_fixture()
        fixture.add_knowledge('isolated', '## Current state\n\n## Event log\n')
        result = fixture.run()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('Warning: Orphaned note', result.stdout)
        self.assertEqual(fixture.run('--strict-orphans').returncode, 1)

    def test_bad_yaml_and_missing_wikilinks_fail(self):
        fixture = self.with_fixture()
        path = fixture.add_knowledge('example', '## Current state\n\n## Event log\n[[Missing]]')
        self.assert_failure_contains(fixture, 'Unresolved wikilink')
        path.write_text(path.read_text().replace('title: example', 'title: 42'))
        self.assert_failure_contains(fixture, 'title: Input should be a valid string')

    def test_broken_link_is_rejected(self):
        fixture = self.with_fixture()
        fixture.add_knowledge(
            "broken-link",
            "## Current state\n\n## Event log\n\n[Missing](missing.md)",
        )
        self.assert_failure_contains(fixture, "Broken link:")

    def test_duplicate_state_key_is_rejected(self):
        fixture = self.with_fixture()
        state = (
            "## Current state\n\n"
            "- [state:duplicate-key] Value\n"
            "  - Effective: 2026-08-31\n"
            "  - Last confirmed: 2026-08-31\n"
            "  - Source: Fixture\n"
            "  - Transaction: 550e8400-e29b-41d4-a716-446655440000\n\n"
            "## Event log\n"
        )
        fixture.add_knowledge("duplicate-one", state)
        fixture.add_knowledge("duplicate-two", state)
        self.assert_failure_contains(
            fixture,
            "Duplicate current state key 'duplicate-key'",
        )

    def test_missing_transaction_metadata_is_rejected(self):
        fixture = self.with_fixture()
        fixture.add_knowledge(
            "missing-transaction",
            "## Current state\n\n"
            "- [state:missing-transaction] Value\n"
            "  - Effective: 2026-08-31\n"
            "  - Last confirmed: 2026-08-31\n"
            "  - Source: Fixture\n\n"
            "## Event log\n",
        )
        self.assert_failure_contains(fixture, "missing Transaction:")

    def test_provider_specific_core_marker_is_rejected(self):
        fixture = self.with_fixture()
        fixture.write(
            "2.core/system/operating-rules.md",
            "This portable Core must not contain fixture-provider configuration.\n",
        )
        self.assert_failure_contains(
            fixture,
            "Provider-specific marker 'fixture-provider' in Core file:",
        )

    def test_unsupported_raw_source_is_rejected(self):
        fixture = self.with_fixture()
        raw = fixture.root / "2.core/sources/raw/document.pdf"
        raw.write_bytes(b"%PDF fixture")
        self.assert_failure_contains(fixture, "Unsupported raw source format:")

    def test_missing_frontmatter_is_rejected(self):
        fixture = self.with_fixture()
        fixture.add_knowledge(
            "missing-frontmatter",
            "## Current state\n\n## Event log\n",
            frontmatter=False,
        )
        self.assert_failure_contains(fixture, "Missing YAML frontmatter:")

    def test_missing_skill_dependency_is_rejected(self):
        fixture = self.with_fixture()
        fixture.write(
            "3.add-ons/skills/catalogue/example/manifest.json",
            json.dumps({"name": "example", "uses": ["missing-skill"]}),
        )
        fixture.write(
            "3.add-ons/skills/catalogue/example/SKILL.md",
            "# Example skill\n",
        )
        self.assert_failure_contains(
            fixture,
            "Skill example depends on missing skill missing-skill",
        )

    def test_valid_transaction_and_legacy_identifier_pass(self):
        for transaction in (self.TRANSACTION, "2020-01-01-synthetic-save",
                            "`2020-01-01-synthetic-save`"):
            with self.subTest(transaction=transaction):
                fixture = self.with_fixture()
                fixture.add_knowledge("synthetic", self.transaction_record(transaction))
                fixture.write("2.core/system/activity-log.md", self.transaction_log(transaction))
                result = fixture.run()
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_transaction_log_entry_fails_with_record_location(self):
        fixture = self.with_fixture()
        fixture.add_knowledge("synthetic", self.transaction_record())
        # A prefix match and an identifier in prose cannot satisfy the reference.
        fixture.write("2.core/system/activity-log.md",
                      self.transaction_log(self.TRANSACTION + "-other") +
                      f"\nMentioned transaction: {self.TRANSACTION}\n")
        result = fixture.run()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn(f"Missing Activity Log entry for transaction '{self.TRANSACTION}'", result.stdout)
        self.assertIn("2.core/knowledge/synthetic.md:", result.stdout)

    def test_duplicate_log_entries_fail(self):
        fixture = self.with_fixture()
        fixture.add_knowledge("synthetic", self.transaction_record())
        fixture.write("2.core/system/activity-log.md", self.transaction_log() * 2)
        self.assert_failure_contains(fixture, "Duplicate Activity Log entries")

    def test_missing_or_malformed_log_information_fails(self):
        cases = (
            ("- Affected paths: `2.core/knowledge/synthetic.md`\n", "", "requires one Affected paths field"),
            ("- Affected paths: `2.core/knowledge/synthetic.md`", "- Affected paths: ", "requires one Affected paths field"),
            ("`2.core/knowledge/synthetic.md`", "`../outside.md`", "requires one Affected paths field"),
            ("`2.core/knowledge/synthetic.md`", "`2.core/knowledge/other.md`", "affected paths omit referenced record"),
            ("- Commit: enclosing commit\n", "", "requires exactly one Commit: enclosing commit"),
            ("enclosing commit", "pending", "requires exactly one Commit: enclosing commit"),
            ("enclosing commit", "0123456789abcdef", "requires exactly one Commit: enclosing commit"),
            ("- Commit: enclosing commit", "- Commit: enclosing commit\n- Commit: enclosing commit", "requires exactly one Commit: enclosing commit"),
            (f"- Transaction: {self.TRANSACTION}", f"- Transaction: {self.TRANSACTION}\n- Transaction: other-id", "requires exactly one Transaction field"),
            (f"- Transaction: {self.TRANSACTION}", f"- Transaction: {self.TRANSACTION}\n- Transaction: {self.TRANSACTION}", "requires exactly one Transaction field"),
            ("- Affected paths: `2.core/knowledge/synthetic.md`", "- Affected paths: `2.core/knowledge/synthetic.md`\n- Paths: `2.core/knowledge/synthetic.md`", "requires one Affected paths field"),
        )
        for before, after, message in cases:
            with self.subTest(message=message, after=after):
                fixture = self.with_fixture()
                fixture.add_knowledge("synthetic", self.transaction_record())
                fixture.write("2.core/system/activity-log.md", self.transaction_log().replace(before, after))
                self.assert_failure_contains(fixture, message)

    def test_all_referencing_record_paths_must_be_listed(self):
        fixture = self.with_fixture()
        fixture.add_knowledge("synthetic", self.transaction_record())
        fixture.write("2.core/memory/core.md",
                      "---\ntitle: Memory\ntype: memory\nupdated: 2026-01-01\n---\n" +
                      self.transaction_record().replace("synthetic-status", "memory-status")
                      .replace("synthetic-start", "memory-start"))
        fixture.write("2.core/system/activity-log.md", self.transaction_log())
        self.assert_failure_contains(fixture, "affected paths omit referenced record 2.core/memory/core.md")
        fixture.write("2.core/system/activity-log.md", self.transaction_log(
            paths="`2.core/knowledge/synthetic.md`, `2.core/memory/core.md`, `2.core/knowledge/removed.md`, README.md"
        ).replace("Affected paths:", "Paths:"))
        result = fixture.run()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_blank_or_multiple_record_transaction_fields_fail(self):
        for replacement in ("", "two identifiers", self.TRANSACTION + "\n  - Transaction: another-id"):
            with self.subTest(replacement=replacement):
                fixture = self.with_fixture()
                fixture.add_knowledge("synthetic", self.transaction_record().replace(self.TRANSACTION, replacement))
                self.assert_failure_contains(fixture, "requires one nonblank Transaction:")

    def test_sample_locations_and_hidden_examples_do_not_require_logs(self):
        fixture = self.with_fixture()
        for relative in ("2.core/examples/sample.md", "2.core/templates/sample.md",
                         "2.core/docs/sample.md", "2.core/scripts/fixtures/sample.md",
                         "2.core/archive/sample.md", "2.core/sources/raw/sample.md",
                         "1.plugins/sample.md", "3.add-ons/sample.md"):
            fixture.write(relative, self.transaction_record())
        samples = ""
        for opening, closing in (("```markdown", "```"), ("~~~markdown", "~~~"), ("<!--", "-->")):
            samples += opening + "\n" + self.transaction_record() + "\n" + closing + "\n"
        fixture.add_knowledge("synthetic", samples + "\n## Current state\n\n## Event log\n")
        fixture.write("2.core/system/activity-log.md", samples)
        result = fixture.run()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fenced_log_entry_cannot_satisfy_a_live_reference(self):
        fixture = self.with_fixture()
        fixture.add_knowledge("synthetic", self.transaction_record())
        fixture.write("2.core/system/activity-log.md", "```markdown\n" + self.transaction_log() + "```\n")
        self.assert_failure_contains(fixture, "Missing Activity Log entry")

    def test_event_transaction_is_checked_independently(self):
        fixture = self.with_fixture()
        state, event = self.transaction_record().split("## Event log", 1)
        fixture.add_knowledge("synthetic", state + "## Event log" +
                              event.replace(self.TRANSACTION, "2020-01-01-event-only"))
        fixture.write("2.core/system/activity-log.md", self.transaction_log())
        self.assert_failure_contains(fixture, "Missing Activity Log entry for transaction '2020-01-01-event-only'")

    def test_commit_field_cannot_be_borrowed_from_another_log_entry(self):
        fixture = self.with_fixture()
        fixture.add_knowledge("synthetic", self.transaction_record())
        fixture.write("2.core/system/activity-log.md",
                      self.transaction_log().replace("- Commit: enclosing commit\n", "") +
                      self.transaction_log("another-id"))
        self.assert_failure_contains(fixture, "requires exactly one Commit: enclosing commit")

    def test_source_note_and_system_register_events_are_checked(self):
        for relative in ("2.core/sources/notes/synthetic.md", "2.core/system/source-register.md"):
            with self.subTest(relative=relative):
                fixture = self.with_fixture()
                body = self.transaction_record().split("## Event log", 1)[1]
                if "/sources/notes/" in relative:
                    body = ("---\ntitle: Synthetic\ntype: source-note\nupdated: 2026-01-01\n---\n"
                            "- Source kind: direct\n- Original source: https://example.test/fixture\n" + body)
                    fixture.write("2.core/index.md", "sources/notes/synthetic.md\n")
                fixture.write(relative, body)
                self.assert_failure_contains(fixture, "Missing Activity Log entry")
                fixture.write("2.core/system/activity-log.md", self.transaction_log(paths=relative))
                result = fixture.run()
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
