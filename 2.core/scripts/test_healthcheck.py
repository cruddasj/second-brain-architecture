"""Health checks run in synthetic repositories, including a byte-for-byte audit."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parents[1]
PLUGIN_ID = "befe7498-69c4-4f09-913d-9b36830a9882"


class HealthcheckTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("healthcheck.py",):
            target = self.root / "2.core/scripts" / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SCRIPTS / name, target)
        from test_check_second_brain_fixtures import ValidatorFixture
        self.fixture = ValidatorFixture(self.root)
        self.write("2.core/system/repository-config.json", json.dumps({
            "version": 1, "knowledge_categories": [], "required_theme_pages": []}))
        self.write("1.plugins/plugin-registry.json", json.dumps({
            "plugins": [{"id": PLUGIN_ID, "path": "hosting"}]}))
        self.write("1.plugins/hosting/README.md", f"# Synthetic hosting adapter\nPlugin ID: {PLUGIN_ID}\n")
        self.write("1.plugins/hosting/repository.md", "- Canonical remote: `https://example.invalid/brain`\n- Default branch: `main`\n")
        self.write(".gitignore", (ROOT / ".gitignore").read_text())
        self.write(".pre-commit-config.yaml", (ROOT / ".pre-commit-config.yaml").read_text())
        self.git("init", "--initial-branch=main")
        self.git("remote", "add", "origin", "https://example.invalid/brain.git")
        self.git("add", ".")

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True,
                              capture_output=True, text=True).stdout

    def snapshot(self):
        return {path.relative_to(self.root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
                for path in self.root.rglob("*") if path.is_file()}

    def run_check(self, direct=False, *args):
        before = self.snapshot()
        config = self.git("config", "--local", "--list") if (self.root / ".git").exists() else None
        # No -B: the entry point itself must suppress bytecode writes.
        command = [sys.executable, str(self.root / "2.core/scripts/check_second_brain.py"),
                   "--healthcheck", *args] if direct else [sys.executable, str(self.root / "2.core/scripts/healthcheck.py")]
        result = subprocess.run(command,
                                cwd=self.root, stdin=subprocess.DEVNULL,
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(before, self.snapshot(), "health check changed repository or Git files")
        if config is not None:
            self.assertEqual(config, self.git("config", "--local", "--list"))
        self.assertEqual(result.stderr, "")
        return result

    def test_configured_copy_passes_local_checks_with_explicit_unknowns(self):
        result = self.run_check()
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("[FAIL]", result.stdout)
        for message in ("structure and required values are valid", "tracked formats comply",
                        "Second-brain check passed", "setup readiness unknown"):
            self.assertIn(message, result.stdout)

    def test_synthetic_repository_with_real_core_validator(self):
        fixture = self.fixture
        result = self.run_check()
        self.assertEqual(result.returncode, 2, result.stdout)
        self.assertIn("[PASS] Core validator: Second-brain check passed", result.stdout)
        fixture.add_knowledge("broken", "## Current state\n\n## Event log\n[Missing](missing.md)")
        result = self.run_check()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Broken link:", result.stdout)

    def test_direct_health_option_matches_wrapper(self):
        direct = self.run_check(True)
        wrapper = self.run_check()
        self.assertEqual((direct.returncode, direct.stdout), (wrapper.returncode, wrapper.stdout))

    def test_direct_health_option_without_dependencies(self):
        self.write("2.core/scripts/yaml.py", "raise ModuleNotFoundError('synthetic dependency')\n")
        result = self.run_check(True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("install 2.core/scripts/requirements.txt separately", result.stdout)

    def test_health_option_preserves_strict_orphans(self):
        self.fixture.add_knowledge("isolated", "## Current state\n\n## Event log\n")
        self.assertEqual(self.run_check(True).returncode, 2)
        result = self.run_check(True, "--strict-orphans")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Orphaned note", result.stdout)

    def test_unresolved_setup_placeholders_fail(self):
        for name, text in (("repository.md", "- Canonical remote: `https://github.com/OWNER/REPOSITORY`"),
                           ("config.json", '{"folder": "<provider-folder-id>"}'),
                           ("project-instructions.md", "Use OWNER/REPOSITORY")):
            with self.subTest(name=name):
                path = self.root / "1.plugins/hosting" / name
                old = path.read_text() if path.exists() else None
                self.write(str(path.relative_to(self.root)), text)
                result = self.run_check()
                self.assertEqual(result.returncode, 1)
                self.assertIn("unresolved", result.stdout)
                if old is None:
                    path.unlink()
                else:
                    path.write_text(old)

    def test_templates_examples_and_workflow_expressions_are_allowed(self):
        self.write("1.plugins/examples/source-config.example.json", '{"folder": "<provider-folder-id>"}')
        self.write("1.plugins/PLUGIN_TEMPLATE.md", "Plugin: <name> OWNER/REPOSITORY")
        self.write("1.plugins/hosting/project-instructions.md", "Local checkout: `<path-to-your-clone>`")
        self.write(".github/workflows/example.yml", "value: ${{ github.ref }}")
        result = self.run_check()
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("[FAIL]", result.stdout)
        self.assertIn("optional project-instructions template is unconfigured", result.stdout)

    def test_invalid_repository_configuration(self):
        for config in ('{"knowledge_categories": "projects", "required_theme_pages": []}',
                       '{"knowledge_categories": ["../bad"], "required_theme_pages": []}',
                       '{"knowledge_categories": [], "required_theme_pages": ["x.md", "x.md"]}',
                       '[]', '{'):
            with self.subTest(config=config):
                self.write("2.core/system/repository-config.json", config)
                result = self.run_check()
                self.assertEqual(result.returncode, 1)
                self.assertIn("[FAIL] 2.core/system/repository-config.json", result.stdout)

    def test_invalid_plugin_registry(self):
        self.write("1.plugins/plugin-registry.json", '{"plugins": [{"id": "bad", "path": "../bad"}]}')
        self.assertEqual(self.run_check().returncode, 1)

    def test_missing_raw_ignore_rules_fail(self):
        self.write(".gitignore", "__pycache__/\n")
        result = self.run_check()
        self.assertEqual(result.returncode, 1)
        self.assertIn("correct .gitignore", result.stdout)

    def test_tracked_raw_formats_checked_even_if_file_deleted(self):
        self.write("2.core/sources/raw/nested/scan.PDF", "Synthetic unsupported source")
        self.git("add", "--force", "2.core/sources/raw/nested/scan.PDF")
        (self.root / "2.core/sources/raw/nested/scan.PDF").unlink()
        result = self.run_check()
        self.assertEqual(result.returncode, 1)
        self.assertIn("remove unsupported format from tracking", result.stdout)

    def test_allowed_tracked_raw_files(self):
        for name in ("nested/notes.TXT", "notes.rtf", "notes.md", ".gitkeep"):
            self.write("2.core/sources/raw/" + name, "Synthetic text")
        self.git("add", "2.core/sources/raw")
        self.assertEqual(self.run_check().returncode, 2)

    def test_missing_hook_configuration(self):
        (self.root / ".pre-commit-config.yaml").unlink()
        self.assertEqual(self.run_check().returncode, 1)

    def test_indeterminate_plugin_state_never_claims_activation(self):
        result = self.run_check()
        self.assertIn("[WARN] 1.plugins/hosting: setup readiness unknown", result.stdout)
        self.assertNotIn("Plugin activated", result.stdout)

    def test_missing_validator_dependencies(self):
        self.write("2.core/scripts/yaml.py", "raise ModuleNotFoundError('synthetic dependency')\n")
        result = self.run_check()
        self.assertEqual(result.returncode, 2)
        self.assertIn("install 2.core/scripts/requirements.txt separately", result.stdout)

    def test_validator_failure_is_reported(self):
        self.fixture.add_knowledge("broken", "## Current state\n\n## Event log\n[Missing](missing.md)")
        result = self.run_check()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Broken link:", result.stdout)

    def test_archive_is_not_initialised(self):
        shutil.rmtree(self.root / ".git")
        result = self.run_check()
        self.assertEqual(result.returncode, 2)
        self.assertIn("no repository was initialised", result.stdout)
        self.assertFalse((self.root / ".git").exists())

    def test_symlink_config_is_not_read(self):
        target = self.root / "1.plugins/hosting/config.json"
        target.symlink_to(self.root / "missing-credential-file")
        result = self.run_check()
        self.assertEqual(result.returncode, 1)
        self.assertIn("symbolic links are not inspected", result.stdout)


if __name__ == "__main__":
    unittest.main()
