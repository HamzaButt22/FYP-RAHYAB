"""Pure rules for joining: nickname checks (FR-102, NFR-44, NFR-74) and age handling (FR-04, FR-100).

No database here, so every rule has fast unit tests (tests/test_join_rules.py).
"""

import unicodedata
from datetime import date, timedelta, timezone

# Zero-width and bidi-override characters are removed, not rejected (forms-and-errors.md §4, TC-VAL-06).
_INVISIBLE = (
    {chr(c) for c in range(0x200B, 0x2010)}
    | {chr(c) for c in range(0x202A, 0x202F)}
    | {chr(c) for c in range(0x2066, 0x206A)}
    | {"﻿"}
)

NICKNAME_MIN, NICKNAME_MAX = 2, 20
PHONE_DIGITS = 7  # 7 or more digits anywhere in a nickname looks like a phone number

MIN_AGE = 13  # under 13 are not served (FR-04)
SELF_CONSENT_AGE = 18  # adults consent for themselves (FR-100)
PAKISTAN = timezone(timedelta(hours=5))  # PKT has no daylight saving time


def clean_nickname(raw: str) -> str:
    text = unicodedata.normalize("NFC", raw)
    text = "".join(ch for ch in text if ch not in _INVISIBLE)
    return " ".join(text.split())  # trim and collapse runs of spaces


def nickname_problem(nickname: str) -> str | None:
    """Returns a field-error code, or None when the cleaned nickname is acceptable."""
    if "@" in nickname or sum(ch.isdecimal() for ch in nickname) >= PHONE_DIGITS:
        return "contains_phone"
    if len(nickname) < NICKNAME_MIN:
        return "too_short"
    if len(nickname) > NICKNAME_MAX:
        return "too_long"
    for ch in nickname:
        if ch in "_ ":
            continue
        # Letters, numbers and combining marks (Urdu vowel marks such as zabar and zer are category M).
        if unicodedata.category(ch)[0] not in ("L", "M", "N"):
            return "format"
    return None


def age_in_months(birth_year: int, birth_month: int, today: date) -> int:
    """Whole months between the birth month and today's month (the day of birth is not collected)."""
    return (today.year * 12 + today.month) - (birth_year * 12 + birth_month)


def age_band(years: int) -> str:
    if years <= 15:
        return "13-15"
    if years <= 17:
        return "16-17"
    if years <= 19:
        return "18-19"
    if years <= 24:
        return "20-24"
    return "25+"
