"""Exercise onboarding in disposable repositories, never the public checkout."""
import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("scaffold_setup", ROOT / "setup.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.patch = patch.object(setup, "ROOT", self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        config = self.root / "1.plugins/github/repository.md"
        config.parent.mkdir(parents=True)
        config.write_text("https://github.com/OWNER/REPOSITORY\n- Default branch: `main`\n")
        (self.root / "AGENTS.md").write_text("Generic pointer\n")

    def git(self, *args):
        return setup.run("git", *args)

    def test_archive_initialises_and_configures_without_commit(self):
        setup.configure("example-org/example-brain", "knowledge")
        self.assertEqual(self.git("branch", "--show-current"), "knowledge")
        self.assertEqual(self.git("remote", "get-url", "origin"),
                         "https://github.com/example-org/example-brain.git")
        self.assertIn("`knowledge`", (self.root / "1.plugins/github/repository.md").read_text())
        self.assertEqual((self.root / "AGENTS.md").read_text(), "Generic pointer\n")
        self.assertEqual(self.git("diff", "--cached", "--name-only"), "")

    def test_conflicting_origin_is_preserved(self):
        self.git("init")
        self.git("remote", "add", "origin", "https://example.invalid/upstream.git")
        with self.assertRaisesRegex(ValueError, "origin differs"):
            setup.configure("example-org/example-brain", "main")
        self.assertIn("OWNER/REPOSITORY", (self.root / "1.plugins/github/repository.md").read_text())

    def test_clean_private_clone_keeps_branch_and_remote(self):
        self.git("init", "--initial-branch", "main")
        self.git("add", ".")
        self.git("-c", "user.name=Example", "-c", "user.email=example@example.invalid",
                 "commit", "-m", "Synthetic fixture")
        remote = "git@github.com:example-org/example-brain.git"
        self.git("remote", "add", "origin", remote)
        setup.configure("example-org/example-brain", "knowledge")
        self.assertEqual(self.git("branch", "--show-current"), "main")
        self.assertEqual(self.git("remote", "get-url", "origin"), remote)
        self.assertNotIn("OWNER/REPOSITORY", (self.root / "1.plugins/github/repository.md").read_text())

    def test_dirty_checkout_is_not_modified(self):
        self.git("init")
        with self.assertRaisesRegex(ValueError, "existing changes"):
            setup.configure("example-org/example-brain", "main")
        self.assertEqual(self.git("remote"), "")

    def test_invalid_input_does_not_initialise(self):
        for repository, branch in [("https://example.invalid/repo", "main"),
                                   ("example-org/example-brain", "../bad"),
                                   ("example-org/example-brain", "bad`branch")]:
            with self.subTest(repository=repository, branch=branch):
                with self.assertRaises((ValueError, subprocess.CalledProcessError)):
                    setup.configure(repository, branch)
                self.assertFalse((self.root / ".git").exists())

    def test_raw_source_ignore_rules(self):
        shutil.copyfile(ROOT / ".gitignore", self.root / ".gitignore")
        self.git("init")
        for name, ignored in [("scan.pdf", True), ("nested/file.docx", True),
                              ("nested/photo.PNG", True), ("archive.zip", True),
                              ("notes.md", False), ("nested/notes.TXT", False),
                              ("nested/notes.rtf", False), (".gitkeep", False)]:
            with self.subTest(name=name):
                result = subprocess.run(["git", "check-ignore", "--no-index", "-q",
                                         "2.core/sources/raw/" + name], cwd=self.root)
                self.assertEqual(result.returncode, 0 if ignored else 1)


if __name__ == "__main__":
    unittest.main()
