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
        self.write("2.core/docs/research.md")
        self.write("2.core/index.md", "# Index\n")
        self.write("2.core/memory/core.md", "# Core memory\n\n## Current state\n")
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
            "---\ntitle: Themes\ntype: index\n---\n\n# Themes\n",
        )
        self.write("2.core/templates/decision-record.md")
        self.write(
            "2.core/scripts/check_second_brain.py",
            Path(check.__file__).read_text(encoding="utf-8"),
        )
        self.write("2.core/scripts/audit_freshness.py")
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
                f"---\ntitle: {name}\ntype: knowledge\n---\n\n"
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

    def run(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(self.core / "scripts/check_second_brain.py")],
            cwd=self.root,
            capture_output=True,
            text=True,
            check=False,
        )


class ValidatorRepositoryFixtureTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
