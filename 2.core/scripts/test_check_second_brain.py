import tempfile
import unittest
from pathlib import Path

import check_second_brain as check


class RepositoryConfigTests(unittest.TestCase):
    def test_valid_config_is_parsed(self):
        errors = []
        categories, themes = check.parse_repository_config(
            {
                "knowledge_categories": ["about-me", "projects"],
                "required_theme_pages": ["finances.md"],
            },
            errors,
        )
        self.assertEqual(errors, [])
        self.assertEqual(categories, ("about-me", "projects"))
        self.assertEqual(themes, ("finances.md",))

    def test_invalid_config_paths_are_rejected(self):
        errors = []
        check.parse_repository_config(
            {
                "knowledge_categories": ["../outside"],
                "required_theme_pages": ["themes/finances.md"],
            },
            errors,
        )
        self.assertEqual(len(errors), 2)

    def test_configured_requirements_build_paths(self):
        files, dirs = check.configured_requirements(
            ("custom-area",), ("custom-theme.md",)
        )
        self.assertTrue(files[0].as_posix().endswith("2.core/themes/custom-theme.md"))
        self.assertTrue(dirs[0].as_posix().endswith("2.core/knowledge/custom-area"))


class RootShimTests(unittest.TestCase):
    def test_valid_root_shim_register_is_parsed(self):
        errors = []
        shims = check.parse_root_shims(
            {
                "root_shims": [
                    {
                        "path": "TOOL.md",
                        "plugin": "vendor",
                        "exact_content": "@AGENTS.md\n",
                    }
                ]
            },
            errors,
        )
        self.assertEqual(errors, [])
        self.assertEqual(shims, {"TOOL.md": ("vendor", "@AGENTS.md\n")})

    def test_nested_root_shim_path_is_rejected(self):
        errors = []
        shims = check.parse_root_shims(
            {
                "root_shims": [
                    {
                        "path": "nested/TOOL.md",
                        "plugin": "vendor",
                        "exact_content": "@AGENTS.md\n",
                    }
                ]
            },
            errors,
        )
        self.assertEqual(shims, {})
        self.assertEqual(len(errors), 1)


class PortabilityMarkerTests(unittest.TestCase):
    def test_simple_marker_uses_token_boundaries(self):
        self.assertTrue(check.text_has_portability_marker("use x3 for this", "x3"))
        self.assertFalse(
            check.text_has_portability_marker("prefixx3suffix", "x3")
        )

    def test_path_style_marker_uses_literal_matching(self):
        self.assertTrue(
            check.text_has_portability_marker("load .vendor/rules", ".vendor/")
        )


class RawSourceFormatTests(unittest.TestCase):
    def test_allowed_raw_source_formats_are_accepted_case_insensitively(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            raw = Path(temp_dir)
            (raw / ".gitkeep").write_text("", encoding="utf-8")
            (raw / "one.txt").write_text("one", encoding="utf-8")
            (raw / "two.RTF").write_text(r"{\rtf1 two}", encoding="utf-8")
            nested = raw / "collection"
            nested.mkdir()
            (nested / "three.Md").write_text("# Three", encoding="utf-8")

            errors = []
            check.check_raw_source_formats(errors, raw)
            self.assertEqual(errors, [])

    def test_other_raw_source_formats_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            raw = Path(temp_dir)
            (raw / "document.pdf").write_bytes(b"%PDF")

            errors = []
            check.check_raw_source_formats(errors, raw)
            self.assertEqual(len(errors), 1)
            self.assertIn("document.pdf", errors[0])
            self.assertIn(".md, .rtf, .txt", errors[0])


if __name__ == "__main__":
    unittest.main()
