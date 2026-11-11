"""Class and claim codes: format, alphabet and randomness (FR-80, FR-05a)."""

import re

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


def test_codes_are_stored_as_sha256() -> None:
    dev_seed = "768a808b75c48e3b1ca14b0bcecdd3486e96e33704f07de56789e0c18224d9a5"
    assert code_hash("RYB-4K2") == dev_seed
