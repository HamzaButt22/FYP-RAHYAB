"""Join rules without a database: nickname cleaning and checks, age and age bands.

First draft by a local model; corrected and extended during review (an emoji alone is too short, and
Urdu vowel marks are allowed).
"""

from datetime import date

import pytest

from rahyaab_api.join_rules import (
    MIN_AGE,
    age_band,
    age_in_months,
    clean_nickname,
    fold_name,
    looks_like_full_name,
    nickname_problem,
)


@pytest.mark.parametrize(
    ("raw", "cleaned"),
    [
        ("ali‮", "ali"),  # TC-VAL-06: right-to-left override removed
        ("​ali", "ali"),  # zero-width space removed
        ("ali﻿", "ali"),  # zero-width no-break space removed
        ("  a   b ", "a b"),  # trimmed, runs of spaces collapsed
        ("Ayesha⁦_10⁩", "Ayesha_10"),  # isolate controls removed
    ],
)
def test_clean_nickname(raw: str, cleaned: str) -> None:
    assert clean_nickname(raw) == cleaned


@pytest.mark.parametrize(
    ("nickname", "problem"),
    [
        ("ali03001234567", "contains_phone"),  # TC-VAL-05
        ("a@b.com", "contains_phone"),  # TC-VAL-05: an email
        ("a", "too_short"),
        ("😀", "too_short"),  # one character: length is checked before characters
        ("a" * 21, "too_long"),
        ("<script>", "format"),  # TC-SEC-13: markup characters are refused
        ("ab😀", "format"),  # emoji
        ("Ayesha_10", None),
        ("عائشہ", None),  # Urdu script
        ("اَلِف", None),  # Urdu with vowel marks (combining marks)
        ("a123456", None),  # 6 digits is not yet a phone number
        ("a1234567", "contains_phone"),  # 7 digits is
        ("۰۳۰۰۱۲۳۴۵۶۷", "contains_phone"),  # Urdu (Extended Arabic-Indic) digits count too
        ("Ayesha Khan", "full_name"),  # TC-VAL-04: a given name and a family name
        ("Ayesha", None),  # one name alone is allowed
    ],
)
def test_nickname_problem(nickname: str, problem: str | None) -> None:
    assert nickname_problem(nickname) == problem


def test_age_boundary_is_13_years_to_the_month() -> None:  # TC-ONB-05
    today = date(2026, 11, 10)
    assert age_in_months(2013, 12, today) == 155  # 12 years 11 months: stopped
    assert age_in_months(2013, 12, today) < MIN_AGE * 12
    assert age_in_months(2013, 11, today) == 156  # exactly 13: joins
    assert age_in_months(2013, 12, date(2026, 12, 1)) == MIN_AGE * 12  # one month later: joins


@pytest.mark.parametrize(
    ("years", "band"),
    [
        (13, "13-15"),
        (15, "13-15"),
        (16, "16-17"),
        (17, "16-17"),
        (18, "18-19"),
        (19, "18-19"),
        (20, "20-24"),
        (24, "20-24"),
        (25, "25+"),
        (40, "25+"),
    ],
)
def test_age_band(years: int, band: str) -> None:
    assert age_band(years) == band


@pytest.mark.parametrize(
    ("nickname", "full"),
    [
        ("Ayesha Khan", True),
        ("ayesha_khan", True),  # underscores separate words too
        ("Ali10Butt", True),  # so do digits
        ("Muhammad Ali", True),  # two given names are a full name in Pakistan
        ("عائشہ خان", True),  # Urdu script
        ("عائشه خان", True),  # Arabic heh typed for the Urdu one
        ("فاطِمہ ملک", True),  # vowel marks are ignored
        ("Ali Ali", False),  # the same name twice is still one name
        ("Ayesha_10", False),
        ("Khan", False),
        ("Cool Ali", False),
        ("Star Gazer", False),
    ],
)
def test_looks_like_full_name(nickname: str, full: bool) -> None:
    assert looks_like_full_name(nickname) is full


def test_fold_name() -> None:
    assert fold_name("ALI7") == "ali"
    assert fold_name("عائشه") == fold_name("عائشہ")
