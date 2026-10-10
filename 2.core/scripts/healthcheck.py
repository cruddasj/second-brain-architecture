#!/usr/bin/env python3
"""Compatibility entry point for the Core validator's read-only health checks."""
import sys

sys.dont_write_bytecode = True
from check_second_brain import main


if __name__ == "__main__":
    raise SystemExit(main(["--healthcheck"]))
