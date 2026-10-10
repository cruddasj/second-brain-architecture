#!/usr/bin/env python3
"""Read-only local setup and health checks; no setup or external access."""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

# Imports must never create bytecode in the repository.
sys.dont_write_bytecode = True
from repository_validation import (  # noqa: E402
    ALLOWED_RAW_SOURCE_SUFFIXES, parse_plugin_registry, parse_repository_config,
    plugin_readme_errors,
)

ROOT = Path(__file__).resolve().parents[2]
PLACEHOLDER = re.compile(r"OWNER/REPOSITORY|<[^<>\n]+>")


class Healthcheck:
    def __init__(self, root: Path):
        self.root = root
        self.results: list[tuple[str, str, str]] = []

    def report(self, status, check, message):
        self.results.append((status, check, message))
        print(f"[{status}] {check}: {message}")

    def read(self, relative):
        path = self.root / relative
        # Do not follow configuration links into credential stores or other trees.
        if any(p.is_symlink() for p in (path, *path.parents)):
            raise ValueError(f"{relative}: symbolic links are not inspected")
        return path.read_text(encoding="utf-8")

    def configuration(self, relative, parser):
        try:
            text = self.read(relative)
            errors = []
            value = parser(json.loads(text), errors)
            if PLACEHOLDER.search(text):
                errors.append(f"{relative}: replace unresolved setup placeholders")
            for error in errors:
                self.report("FAIL", relative, error)
            if not errors:
                self.report("PASS", relative, "structure and required values are valid")
            return value
        except (OSError, ValueError) as error:
            self.report("FAIL", relative, f"restore or correct configuration ({error})")
            return None

    def plugins(self, registry):
        if registry is None:
            return
        for name in sorted(registry.values()):
            relative = f"1.plugins/{name}"
            try:
                text = self.read(f"{relative}/README.md")
                plugin_id = next(key for key, value in registry.items() if value == name)
                errors = plugin_readme_errors(text, plugin_id, name)
                for error in errors:
                    self.report("FAIL", relative, error)
                if not errors:
                    self.report("PASS", relative, "registered adapter files are present")
                for filename in ("repository.md", "config.json", "source-config.json"):
                    if (self.root / relative / filename).exists() or (self.root / relative / filename).is_symlink():
                        config = self.read(f"{relative}/{filename}")
                        # Instructions describing replacement are not configured values.
                        lines = [line for line in config.splitlines()
                                 if not line.startswith("Before use, replace")]
                        if any(PLACEHOLDER.search(line) for line in lines):
                            self.report("FAIL", f"{relative}/{filename}",
                                        "replace unresolved setup placeholders before use")
                instructions = self.root / relative / "project-instructions.md"
                if instructions.exists() or instructions.is_symlink():
                    text = self.read(f"{relative}/project-instructions.md")
                    if "OWNER/REPOSITORY" in text:
                        self.report("FAIL", f"{relative}/project-instructions.md",
                                    "replace unresolved repository placeholder before use")
                    elif PLACEHOLDER.search(text):
                        self.report("WARN", relative,
                                    "optional project-instructions template is unconfigured; configure it if using this Plugin")
                self.report("WARN", relative,
                            "setup readiness unknown: files cannot establish activation, permissions or external access; verify in the invoking integration")
            except (OSError, ValueError) as error:
                self.report("FAIL", relative, f"restore adapter files ({error})")

    def git(self, *args):
        # Disable optional writes and filesystem-monitor processes. No Git command
        # here reads credentials, invokes hooks, changes config or contacts remotes.
        env = {**os.environ, "GIT_OPTIONAL_LOCKS": "0", "GIT_CONFIG_NOSYSTEM": "1",
               "GIT_CONFIG_GLOBAL": os.devnull}
        return subprocess.run(["git", "-c", "core.fsmonitor=false", *args],
                              cwd=self.root, env=env, capture_output=True, timeout=30)

    def raw_protections(self):
        try:
            self.read(".gitignore")
        except (OSError, ValueError) as error:
            self.report("FAIL", "raw protection", f"restore .gitignore ({error})")
        if not shutil.which("git"):
            self.report("WARN", "raw sources", "unknown: Git unavailable; install Git to check ignore rules and tracked files")
            return
        if not (self.root / ".git").exists():
            self.report("WARN", "raw sources", "unknown: no local Git metadata; check a clone (no repository was initialised)")
            return
        # Check effective ignore behaviour, including nested and uppercase paths.
        probes = {"scan.pdf": True, "nested/photo.PNG": True,
                  "nested/document.docx": True, "nested/unknown.bin": True,
                  ".gitkeep": False}
        probes.update({f"nested/notes{variant}": False
                       for suffix in ALLOWED_RAW_SOURCE_SUFFIXES
                       for variant in (suffix, suffix.upper())})
        failed = False
        for name, ignored in probes.items():
            path = "2.core/sources/raw/" + name
            result = self.git("check-ignore", "--no-index", "-q", "--", path)
            if result.returncode not in (0, 1) or (result.returncode == 0) != ignored:
                failed = True
                self.report("FAIL", "raw protection", f"correct .gitignore rules for {path} (expected {'ignored' if ignored else 'allowed'})")
        if not failed:
            self.report("PASS", "raw protection", "effective deny-by-default ignore rules protect raw sources")
        result = self.git("ls-files", "-z", "--", "2.core/sources/raw/")
        if result.returncode:
            self.report("FAIL", "tracked raw sources", "cannot inspect Git index; repair local Git metadata")
        else:
            invalid = [os.fsdecode(path) for path in result.stdout.split(b"\0") if path
                       and Path(os.fsdecode(path)).name != ".gitkeep"
                       and Path(os.fsdecode(path)).suffix.lower() not in ALLOWED_RAW_SOURCE_SUFFIXES]
            for path in invalid:
                self.report("FAIL", "tracked raw sources", f"{path}: remove unsupported format from tracking after reviewing the raw-source policy")
            if not invalid:
                self.report("PASS", "tracked raw sources", "tracked formats comply with Core policy")
        try:
            hooks = self.read(".pre-commit-config.yaml")
            if "python 2.core/scripts/check_second_brain.py" not in hooks:
                raise ValueError("Core validator hook entry missing")
            self.report("PASS", "validation protection", "Core validator commit-hook configuration is present")
            self.report("WARN", "validation protection", "hook installation/enforcement unknown; verify local installation separately")
        except (OSError, ValueError) as error:
            self.report("FAIL", "validation protection", f"restore Core validator hook configuration ({error})")

    def validator(self):
        relative = "2.core/scripts/check_second_brain.py"
        if not (self.root / relative).is_file():
            self.report("WARN", "Core validator", f"unavailable: restore {relative}")
            return
        result = subprocess.run([sys.executable, "-B", str(self.root / relative)],
                                cwd=self.root, capture_output=True, text=True,
                                timeout=120, stdin=subprocess.DEVNULL)
        if "ModuleNotFoundError" in result.stderr or "ImportError" in result.stderr:
            self.report("WARN", "Core validator", "cannot run: install 2.core/scripts/requirements.txt separately, then retry")
        elif result.returncode:
            self.report("FAIL", "Core validator", "validation failed; run the validator directly for details")
            print(result.stdout.rstrip())
            if result.stderr:
                # Tracebacks can contain record text; use the direct command for details.
                print("Validator returned an error on stderr; inspect it with the direct validator command.")
        else:
            status = "WARN" if "Warning:" in result.stdout else "PASS"
            self.report(status, "Core validator", result.stdout.strip())

    def run(self):
        self.configuration("2.core/system/repository-config.json", parse_repository_config)
        registry = self.configuration("1.plugins/plugin-registry.json", parse_plugin_registry)
        self.plugins(registry)
        for check in (self.raw_protections, self.validator):
            try:
                check()
            except (OSError, ValueError, subprocess.TimeoutExpired) as error:
                self.report("WARN", check.__name__, f"check unavailable ({type(error).__name__}); retry after resolving local tooling")
        counts = {status: sum(item[0] == status for item in self.results)
                  for status in ("PASS", "WARN", "FAIL")}
        print("Summary: " + ", ".join(f"{count} {status.lower()}" for status, count in counts.items()))
        return 1 if counts["FAIL"] else 2 if counts["WARN"] else 0


def main():
    return Healthcheck(ROOT).run()


if __name__ == "__main__":
    raise SystemExit(main())
