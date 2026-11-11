"""Secret codes handed out on paper: class codes and consent-slip claim codes (FR-05a, FR-80).

Both use alphabets without look-alike characters (no I, O, 0, 1), so students can type them from a printed
sheet. Every character is random (the `secrets` module); there is no fixed prefix.

- Class code `AAA-XXX`: 24^3 x 32^3 = about 453 million codes. With the join limits (300 tries per IP per
  15 minutes), guessing one live code from one address takes, on average, years.
- Claim code `XXXX-XXXX`: 32^8 = about 1.1 x 10^12 codes, and a class pauses claim codes after 30 failures.
Only SHA-256 hashes are stored (school_class.code_hash, consent_slip.claim_code_hash); a code is shown once.
"""

import hashlib
import secrets

LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"  # 24: no I, O
CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 32: no I, O, 0, 1


def _pick(alphabet: str, n: int) -> str:
    return "".join(secrets.choice(alphabet) for _ in range(n))


def new_class_code() -> str:
    return f"{_pick(LETTERS, 3)}-{_pick(CHARACTERS, 3)}"


def new_claim_code() -> str:
    return f"{_pick(CHARACTERS, 4)}-{_pick(CHARACTERS, 4)}"


def code_hash(code: str) -> str:
    return hashlib.sha256(code.encode("ascii")).hexdigest()
