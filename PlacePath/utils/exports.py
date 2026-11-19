"""
CSV and SQLite backup export utilities for PlacePath.
"""

from __future__ import annotations

import csv
import io
from typing import Any, Dict, List


def records_to_csv_bytes(records: List[Dict[str, Any]], fieldnames: List[str] | None = None) -> bytes:
    """Serialize a list of dictionary records into UTF-8 CSV bytes."""
    buffer = io.StringIO()
    if not records:
        cols = fieldnames or ["info"]
        writer = csv.DictWriter(buffer, fieldnames=cols)
        writer.writeheader()
        return buffer.getvalue().encode("utf-8")

    cols = fieldnames or list(records[0].keys())
    writer = csv.DictWriter(buffer, fieldnames=cols, extrasaction="ignore")
    writer.writeheader()
    for row in records:
        writer.writerow(row)
    return buffer.getvalue().encode("utf-8")
