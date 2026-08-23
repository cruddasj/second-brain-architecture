#!/usr/bin/env python3
"""Produce deterministic, read-only freshness audit candidates for Core Markdown."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path


ENTRY_PATTERN = re.compile(r"^- \[(state|event):([a-z0-9][a-z0-9-]*)\](.*)$")
DATE_PATTERN = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
MONEY_PATTERN = re.compile(
    r"(?<!\w)(?:(?P<symbol>[£$€])\s?(?P<symbol_amount>\d[\d,]*(?:\.\d+)?)|"
    r"(?P<code_amount>\d[\d,]*(?:\.\d+)?)\s?(?P<code>GBP|USD|EUR))(?!\w)",
    re.IGNORECASE,
)
PERCENT_PATTERN = re.compile(r"(?<![\w.])(?P<amount>\d+(?:\.\d+)?)\s?%(?!\w)")
METADATA_PREFIXES = (
    "Effective:",
    "Last confirmed:",
    "Source:",
    "Transaction:",
)
EXCLUDED_PARTS = {".git", "archive", "node_modules", "dist", ".next"}


@dataclass(frozen=True)
class Entry:
    kind: str
    entry_id: str
    path: str
    line: int
    summary: str
    effective: str | None
    last_confirmed: str | None


@dataclass(frozen=True)
class ComparableValue:
    kind: str
    value: str
    path: str
    line: int
    text: str


def parse_iso_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def metadata_date(block: list[str], field: str) -> str | None:
    prefix = f"- {field}:"
    for line in block[1:]:
        stripped = line.strip()
        if stripped.startswith(prefix):
            match = DATE_PATTERN.search(stripped)
            return match.group(1) if match else None
    return None


def parse_entries(path: Path, display_path: str) -> list[Entry]:
    lines = path.read_text(encoding="utf-8").splitlines()
    entries: list[Entry] = []
    in_fence = False
    index = 0

    while index < len(lines):
        line = lines[index]
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            index += 1
            continue
        if in_fence:
            index += 1
            continue

        match = ENTRY_PATTERN.match(line)
        if not match:
            index += 1
            continue

        block = [line]
        cursor = index + 1
        while cursor < len(lines):
            following = lines[cursor]
            if following.startswith("  ") or not following.strip():
                block.append(following)
                cursor += 1
                continue
            break

        entries.append(
            Entry(
                kind=match.group(1),
                entry_id=match.group(2),
                path=display_path,
                line=index + 1,
                summary=match.group(3).strip(),
                effective=metadata_date(block, "Effective"),
                last_confirmed=metadata_date(block, "Last confirmed"),
            )
        )
        index = cursor

    return entries


def markdown_files(root: Path) -> list[Path]:
    if root.is_file():
        return [root] if root.suffix.lower() == ".md" else []
    return sorted(
        path
        for path in root.rglob("*.md")
        if not EXCLUDED_PARTS.intersection(path.relative_to(root).parts)
    )


def extract_values(line: str, path: str, line_number: int) -> list[ComparableValue]:
    values: list[ComparableValue] = []
    for match in MONEY_PATTERN.finditer(line):
        symbol = match.group("symbol")
        code = match.group("code")
        amount = match.group("symbol_amount") or match.group("code_amount") or ""
        currency = symbol or (code or "").upper()
        normalised_amount = amount.replace(",", "")
        values.append(
            ComparableValue("money", f"{currency}{normalised_amount}", path, line_number, line.strip())
        )
    for match in PERCENT_PATTERN.finditer(line):
        values.append(
            ComparableValue("percentage", f"{match.group('amount')}%", path, line_number, line.strip())
        )
    return values


def subject_values(files: list[Path], root: Path, subject: str) -> list[ComparableValue]:
    needle = subject.casefold()
    values: list[ComparableValue] = []
    for path in files:
        display_path = path.relative_to(root).as_posix() if root.is_dir() else path.name
        in_fence = False
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if line.lstrip().startswith("```"):
                in_fence = not in_fence
                continue
            stripped = line.strip().removeprefix("- ")
            if in_fence or stripped.startswith(METADATA_PREFIXES) or needle not in line.casefold():
                continue
            values.extend(extract_values(line, display_path, line_number))
    return sorted(values, key=lambda item: (item.kind, item.value, item.path, item.line))


def build_report(
    root: Path,
    *,
    as_of: date,
    stale_after_days: int,
    always_loaded: list[Path],
    subjects: list[str],
) -> dict[str, object]:
    files = markdown_files(root)
    entries: list[Entry] = []
    for path in files:
        display_path = path.relative_to(root).as_posix() if root.is_dir() else path.name
        entries.extend(parse_entries(path, display_path))

    states = sorted(
        (entry for entry in entries if entry.kind == "state"),
        key=lambda entry: (entry.entry_id, entry.path, entry.line),
    )
    state_groups: dict[str, list[Entry]] = {}
    for entry in states:
        state_groups.setdefault(entry.entry_id, []).append(entry)

    duplicate_state_keys = []
    for entry_id, group in sorted(state_groups.items()):
        if len(group) < 2:
            continue
        summaries = {re.sub(r"\s+", " ", entry.summary).casefold() for entry in group}
        duplicate_state_keys.append(
            {
                "entry_id": entry_id,
                "different_values": len(summaries) > 1,
                "locations": [asdict(entry) for entry in group],
            }
        )

    stale_state = []
    invalid_confirmation_dates = []
    for entry in states:
        confirmed = parse_iso_date(entry.last_confirmed)
        if entry.last_confirmed and confirmed is None:
            invalid_confirmation_dates.append(asdict(entry))
        elif confirmed is not None:
            age_days = (as_of - confirmed).days
            if age_days > stale_after_days:
                stale_state.append({**asdict(entry), "age_days": age_days})

    always_loaded_claims = []
    for supplied_path in always_loaded:
        resolved = supplied_path if supplied_path.is_absolute() else root / supplied_path
        if not resolved.is_file():
            always_loaded_claims.append({"path": supplied_path.as_posix(), "error": "not found"})
            continue
        display_path = resolved.relative_to(root).as_posix() if root.is_dir() else resolved.name
        always_loaded_claims.append(
            {
                "path": display_path,
                "state_claims": [
                    asdict(entry)
                    for entry in parse_entries(resolved, display_path)
                    if entry.kind == "state"
                ],
            }
        )

    subject_reports = []
    comparable_count = 0
    for subject in subjects:
        values = subject_values(files, root, subject)
        comparable_count += len(values)
        distinct_by_kind: dict[str, set[str]] = {}
        for value in values:
            distinct_by_kind.setdefault(value.kind, set()).add(value.value)
        subject_reports.append(
            {
                "subject": subject,
                "values": [asdict(value) for value in values],
                "value_drift_candidates": [
                    {"kind": kind, "values": sorted(distinct)}
                    for kind, distinct in sorted(distinct_by_kind.items())
                    if len(distinct) > 1
                ],
            }
        )

    warnings = [
        "Scanner findings are candidates, not semantic judgements. An agent or person must classify claims as confirmed, contradicted or unsupported."
    ]
    if not subjects:
        warnings.append(
            "No subject scan was requested, so comparable monetary and percentage values were not searched by subject."
        )
    elif comparable_count == 0:
        warnings.append(
            "No comparable monetary or percentage values were found for the requested subjects; this is not proof of freshness."
        )

    return {
        "schema_version": 1,
        "as_of": as_of.isoformat(),
        "root": root.as_posix(),
        "stale_after_days": stale_after_days,
        "summary": {
            "markdown_files": len(files),
            "state_entries": len(states),
            "duplicate_state_keys": len(duplicate_state_keys),
            "stale_state_entries": len(stale_state),
            "invalid_confirmation_dates": len(invalid_confirmation_dates),
            "subjects_scanned": len(subjects),
        },
        "duplicate_state_keys": duplicate_state_keys,
        "stale_state_entries": stale_state,
        "invalid_confirmation_dates": invalid_confirmation_dates,
        "always_loaded": always_loaded_claims,
        "subject_scans": subject_reports,
        "coverage_warnings": warnings,
    }


def render_text(report: dict[str, object]) -> str:
    summary = report["summary"]
    assert isinstance(summary, dict)
    lines = [
        "Freshness audit candidate scan",
        f"As of: {report['as_of']}",
        f"Markdown files: {summary['markdown_files']}",
        f"State entries: {summary['state_entries']}",
        f"Duplicate state keys: {summary['duplicate_state_keys']}",
        f"Stale state entries: {summary['stale_state_entries']}",
        f"Invalid confirmation dates: {summary['invalid_confirmation_dates']}",
    ]
    for warning in report["coverage_warnings"]:
        lines.append(f"Coverage warning: {warning}")
    return "\n".join(lines)


def parser() -> argparse.ArgumentParser:
    argument_parser = argparse.ArgumentParser(
        description="Scan Core Markdown for deterministic freshness audit candidates without writing files."
    )
    argument_parser.add_argument("root", nargs="?", default="2.core")
    argument_parser.add_argument(
        "--always-loaded",
        action="append",
        default=[],
        metavar="PATH",
        help="Path relative to root, or an absolute path. Repeat as needed.",
    )
    argument_parser.add_argument(
        "--subject",
        action="append",
        default=[],
        help="Case-insensitive subject text for comparable monetary and percentage value scanning.",
    )
    argument_parser.add_argument("--as-of", help="Audit date in YYYY-MM-DD form. Defaults to today.")
    argument_parser.add_argument("--stale-after-days", type=int, default=180)
    argument_parser.add_argument("--json", action="store_true", dest="as_json")
    return argument_parser


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Audit root does not exist: {root}", file=sys.stderr)
        return 2
    if args.stale_after_days < 0:
        print("--stale-after-days must be zero or greater", file=sys.stderr)
        return 2
    try:
        as_of = date.fromisoformat(args.as_of) if args.as_of else date.today()
    except ValueError:
        print("--as-of must use YYYY-MM-DD", file=sys.stderr)
        return 2

    always_loaded = [Path(value) for value in args.always_loaded] or [Path("memory/core.md")]
    report = build_report(
        root,
        as_of=as_of,
        stale_after_days=args.stale_after_days,
        always_loaded=always_loaded,
        subjects=args.subject,
    )
    if args.as_json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(render_text(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
