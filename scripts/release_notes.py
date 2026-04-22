#!/usr/bin/env python3

from __future__ import annotations

import pathlib
import sys


def extract_release_section(changelog_path: pathlib.Path, version: str) -> str:
    lines = changelog_path.read_text(encoding="utf-8").splitlines()
    header = f"## [{version}]"
    start = None

    for index, line in enumerate(lines):
        if line.startswith(header):
            start = index + 1
            break

    if start is None:
        raise ValueError(f"Could not find release section for version {version}.")

    end = len(lines)
    for index in range(start, len(lines)):
        if lines[index].startswith("## ["):
            end = index
            break

    section = "\n".join(lines[start:end]).strip()
    if not section:
        raise ValueError(f"Release section for version {version} is empty.")

    return section


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: release_notes.py <CHANGELOG.md> <version>", file=sys.stderr)
        return 1

    changelog_path = pathlib.Path(sys.argv[1])
    version = sys.argv[2]

    if not changelog_path.exists():
        print(f"Changelog not found: {changelog_path}", file=sys.stderr)
        return 1

    try:
        print(extract_release_section(changelog_path, version))
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
