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


class PluginRegistryTests(unittest.TestCase):
    def test_valid_registry_is_parsed(self):
        errors = []
        registry = check.parse_plugin_registry(
            {
                "plugins": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "path": "vendor",
                    }
                ]
            },
            errors,
        )
        self.assertEqual(errors, [])
        self.assertEqual(
            registry,
            {"550e8400-e29b-41d4-a716-446655440000": "vendor"},
        )

    def test_non_v4_or_duplicate_registry_entries_are_rejected(self):
        errors = []
        registry = check.parse_plugin_registry(
            {
                "plugins": [
                    {
                        "id": "550e8400-e29b-11d4-a716-446655440000",
                        "path": "vendor",
                    },
                    {
                        "id": "9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77",
                        "path": "vendor",
                    },
                    {
                        "id": "6fa459ea-ee8a-4ca4-894e-db77e160355e",
                        "path": "vendor",
                    },
                ]
            },
            errors,
        )
        self.assertEqual(
            registry,
            {"9f7c2e13-8b65-4d2a-a6f1-6cbe7e649b77": "vendor"},
        )
        self.assertEqual(len(errors), 2)


class SourceReferenceTests(unittest.TestCase):
    PLUGIN_ID = "550e8400-e29b-41d4-a716-446655440000"

    def check_note(self, body):
        with tempfile.TemporaryDirectory() as temp_dir:
            source_root = Path(temp_dir)
            (source_root / "note.md").write_text(body, encoding="utf-8")
            errors = []
            check.check_source_note_references(
                errors,
                {self.PLUGIN_ID: "vendor"},
                source_root,
            )
            return errors

    def test_direct_source_requires_original_source(self):
        self.assertEqual(
            self.check_note("- Source kind: direct\n- Original source: https://example.test\n"),
            [],
        )
        self.assertEqual(len(self.check_note("- Source kind: direct\n")), 1)

    def test_plugin_source_uses_registered_opaque_reference(self):
        self.assertEqual(
            self.check_note(
                f"- Source kind: plugin\n"
                f"- Plugin ID: {self.PLUGIN_ID}\n"
                "- Plugin provider resource ID: opaque-123\n"
            ),
            [],
        )

    def test_plugin_source_rejects_unknown_id_and_original_source(self):
        errors = self.check_note(
            "- Source kind: plugin\n"
            "- Plugin ID: 6fa459ea-ee8a-4ca4-894e-db77e160355e\n"
            "- Plugin provider resource ID: opaque-123\n"
            "- Original source: https://provider.test/item/opaque-123\n"
        )
        self.assertEqual(len(errors), 2)


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
