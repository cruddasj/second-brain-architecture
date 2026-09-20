#!/usr/bin/env python3
"""Configure a private copy; never create, publish or change a hosted repository."""
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(*args):
    executable = shutil.which(args[0])
    if not executable:
        raise RuntimeError(f"Required command not found: {args[0]}")
    return subprocess.run([executable, *args[1:]], cwd=ROOT, check=True,
                          text=True, capture_output=True).stdout.strip()


def configure(repository, branch):
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9][A-Za-z0-9._-]*", repository):
        raise ValueError("Use OWNER/REPOSITORY, without a URL or credentials.")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", branch):
        raise ValueError("Use a plain branch name containing letters, digits, dots, slashes, underscores or hyphens.")
    run("git", "check-ref-format", "--branch", branch)
    remote = f"https://github.com/{repository}.git"
    if (ROOT / ".git").exists():
        remotes = run("git", "remote").splitlines()
        if "origin" in remotes:
            existing = run("git", "remote", "get-url", "origin")
            accepted = {remote, remote[:-4], f"git@github.com:{repository}.git"}
            if existing not in accepted:
                raise ValueError("Existing origin differs. Use a copy cloned from your private repository, or an extracted archive.")
        if run("git", "status", "--porcelain"):
            raise ValueError("Commit or set aside existing changes before setup.")
    else:
        # Do not accidentally configure an enclosing repository.
        parent = subprocess.run([shutil.which("git"), "rev-parse", "--show-toplevel"],
                                cwd=ROOT, capture_output=True)
        if parent.returncode == 0:
            raise ValueError("Extract the scaffold outside any existing repository.")
        run("git", "init", "--initial-branch", branch)
        remotes = []
    if "origin" not in remotes:
        run("git", "remote", "add", "origin", remote)
    # Only integration instructions receive instance-specific identifiers.
    # Root/Core AGENTS.md are provider-neutral pointers and stay unchanged.
    for path in sorted((ROOT / "1.plugins").rglob("*.md")):
        if path.is_symlink():
            raise ValueError("Setup does not modify symbolic links.")
        original = path.read_text(encoding="utf-8")
        updated = original.replace("OWNER/REPOSITORY", repository)
        if path == ROOT / "1.plugins/github/repository.md":
            updated = re.sub(r"^- Default branch: `[^`]+`$",
                             f"- Default branch: `{branch}`", updated, flags=re.MULTILINE)
        if updated != original:
            path.write_text(updated, encoding="utf-8")


def main():
    print("Run this only in a copy intended for a private second brain.")
    print("Create the private hosted repository first. Setup cannot verify its visibility.")
    if input("Is this copy for your private repository? [y/N] ").strip().lower() != "y":
        return 0
    repository = input("Private repository (OWNER/REPOSITORY): ").strip()
    branch = input("Canonical default branch [main]: ").strip() or "main"
    install = input("Install explorer dependencies and commit hooks? [Y/n] ").strip().lower() != "n"
    try:
        if install:
            version = run("node", "--version").lstrip("v")
            if tuple(map(int, version.split("."))) < (22, 13, 0):
                raise ValueError("Node.js 22.13.0 or later is required.")
            run("npm", "--version")
        configure(repository, branch)
        if install:
            run("npm", "--prefix", "3.add-ons/browser-explorer", "ci")
            subprocess.run([sys.executable, "-m", "pip", "install", "-r",
                            str(ROOT / "2.core/scripts/requirements.txt"), "pre-commit"], check=True)
            subprocess.run([sys.executable, "-m", "pre_commit", "install"], cwd=ROOT, check=True)
        print("Setup complete. Review the diff and run the README checks before committing.")
        print("No commit or push was made. Existing branches and hosted settings were not changed.")
        return 0
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Setup stopped: {error}", file=sys.stderr)
        if isinstance(error, subprocess.CalledProcessError) and error.stderr:
            print(error.stderr, file=sys.stderr)
        print("Some steps may have completed; inspect the diff before retrying.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
