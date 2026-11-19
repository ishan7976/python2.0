"""
Input validation helpers for PlacePath.
"""

from __future__ import annotations

from datetime import date
from typing import Optional, Tuple
from urllib.parse import urlparse


def validate_required_text(value: str, field_name: str, max_length: int = 200) -> Tuple[bool, str]:
    cleaned = (value or "").strip()
    if not cleaned:
        return False, f"{field_name} is required."
    if len(cleaned) > max_length:
        return False, f"{field_name} must be at most {max_length} characters."
    return True, ""


def validate_sgpa(sgpa: Optional[float], status: str) -> Tuple[bool, str]:
    if sgpa is None:
        if status == "Completed":
            return False, "SGPA is required for a completed semester."
        return True, ""
    if sgpa < 0.0 or sgpa > 10.0:
        return False, "SGPA must be between 0.00 and 10.00."
    return True, ""


def validate_credits(
    total_credits: Optional[float],
    completed_credits: Optional[float],
) -> Tuple[bool, str]:
    if total_credits is not None and total_credits < 0:
        return False, "Total credits cannot be negative."
    if completed_credits is not None and completed_credits < 0:
        return False, "Completed credits cannot be negative."
    if (
        total_credits is not None
        and completed_credits is not None
        and completed_credits > total_credits
    ):
        return False, "Completed credits cannot exceed total credits."
    return True, ""


def validate_url(url: str, field_name: str = "URL") -> Tuple[bool, str]:
    cleaned = (url or "").strip()
    if not cleaned:
        return True, ""
    parsed = urlparse(cleaned)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or "." not in parsed.netloc:
        return False, f"{field_name} must be a valid http:// or https:// URL."
    return True, ""


def validate_date_order(
    start_date_str: str,
    end_date_str: str,
    start_label: str = "Start date",
    end_label: str = "Target date",
) -> Tuple[bool, str]:
    if not start_date_str or not end_date_str:
        return True, ""
    try:
        start_d = date.fromisoformat(start_date_str)
        end_d = date.fromisoformat(end_date_str)
    except ValueError:
        return False, "Dates must be valid ISO dates (YYYY-MM-DD)."
    if end_d < start_d:
        return False, f"{end_label} cannot be earlier than {start_label}."
    return True, ""
