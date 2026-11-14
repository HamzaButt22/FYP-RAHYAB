"""Class and claim codes: format, alphabet and randomness (FR-80, FR-05a)."""

import hashlib
import re

import pytest

from rahyaab_api.codes import CHARACTERS, LETTERS, code_hash, new_claim_code, new_class_code

LOOK_ALIKES = set("IO01")


def test_class_codes_match_the_api_format_and_avoid_look_alikes() -> None:
    codes = {new_class_code() for _ in range(2000)}
    assert all(re.fullmatch(r"[A-Z]{3}-[A-Z0-9]{3}", c) for c in codes)  # JoinRequest.class_code
    assert not set("".join(codes)) & LOOK_ALIKES
    assert len(codes) > 1990  # about 453 million possible codes: repeats in 2,000 draws are very rare


def test_claim_codes_match_the_api_format() -> None:
    codes = {new_claim_code() for _ in range(2000)}
    assert all(re.fullmatch(r"[A-Z0-9]{4}-[A-Z0-9]{4}", c) for c in codes)  # JoinRequest.claim_code
    assert not set("".join(codes)) & LOOK_ALIKES
    assert len(codes) == 2000


def test_alphabets_and_the_size_of_the_code_space() -> None:
    assert len(LETTERS) == 24 and len(CHARACTERS) == 32
    assert len(LETTERS) ** 3 * len(CHARACTERS) ** 3 > 450_000_000
    assert len(CHARACTERS) ** 8 > 10**12


PEPPER = "p" * 32


def test_codes_are_stored_as_a_keyed_hash() -> None:
    # HMAC-SHA256 (RFC 2104): a fixed vector, so the app, the seed (tools/dev.py) and the admin agree.
    assert code_hash("RYB-4K2", PEPPER) == "10a644047f915f47b9cf42bd982f42bb615488c4ac1101e92843d24f0ca3d78e"
    # Not the plain SHA-256 that could be reversed from a leaked database by trying every code.
    assert code_hash("RYB-4K2", PEPPER) != hashlib.sha256(b"RYB-4K2").hexdigest()
    # Another server key gives another hash, so the database alone is not enough.
    assert code_hash("RYB-4K2", PEPPER) != code_hash("RYB-4K2", "q" * 32)


def test_a_short_or_missing_pepper_is_refused() -> None:
    with pytest.raises(ValueError):
        code_hash("RYB-4K2", "")
    with pytest.raises(ValueError):
        code_hash("RYB-4K2", "too-short")
