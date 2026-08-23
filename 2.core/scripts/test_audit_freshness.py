from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("audit_freshness.py")
SPEC = importlib.util.spec_from_file_location("audit_freshness", MODULE_PATH)
assert SPEC and SPEC.loader
AUDIT = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = AUDIT
SPEC.loader.exec_module(AUDIT)


class FreshnessAuditTests(unittest.TestCase):
    def write(self, root: Path, relative: str, content: str) -> None:
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_reports_conflicting_duplicate_state_and_stale_confirmation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            first = """# A
## Current state
- [state:project-price] The price is £100.
  - Effective: 2025-01-01
  - Last confirmed: 2025-01-01
  - Source: User stated
  - Transaction: mem-one
## Event log
"""
            second = first.replace("£100", "£200").replace("mem-one", "mem-two")
            self.write(root, "knowledge/a.md", first)
            self.write(root, "knowledge/b.md", second)
            self.write(root, "memory/core.md", first)

            report = AUDIT.build_report(
                root,
                as_of=date(2026, 8, 23),
                stale_after_days=180,
                always_loaded=[Path("memory/core.md")],
                subjects=[],
            )

            self.assertEqual(report["summary"]["duplicate_state_keys"], 1)
            self.assertTrue(report["duplicate_state_keys"][0]["different_values"])
            self.assertEqual(report["summary"]["stale_state_entries"], 3)
            self.assertEqual(len(report["always_loaded"][0]["state_claims"]), 1)

    def test_subject_scan_reports_comparable_value_drift_candidates(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write(
                root,
                "knowledge/project.md",
                "# Project\n\n- Acme price was £100.\n- Acme price is £125.\n- Acme rate moved from 4% to 5%.\n",
            )

            report = AUDIT.build_report(
                root,
                as_of=date(2026, 8, 23),
                stale_after_days=180,
                always_loaded=[],
                subjects=["Acme"],
            )

            candidates = report["subject_scans"][0]["value_drift_candidates"]
            self.assertEqual(
                candidates,
                [
                    {"kind": "money", "values": ["£100", "£125"]},
                    {"kind": "percentage", "values": ["4%", "5%"]},
                ],
            )

    def test_fenced_examples_and_metadata_are_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.write(
                root,
                "knowledge/project.md",
                """# Project
```
- Acme example £999
```
- Acme current £100
  - Last confirmed: 2026-01-01
""",
            )
            values = AUDIT.subject_values(
                AUDIT.markdown_files(root), root, "Acme"
            )
            self.assertEqual([value.value for value in values], ["£100"])


if __name__ == "__main__":
    unittest.main()
