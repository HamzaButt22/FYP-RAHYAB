"""Secret codes handed out on paper: class codes and consent-slip claim codes (FR-05a, FR-80).

Both use alphabets without look-alike characters (no I, O, 0, 1), so students can type them from a printed
sheet. Every character is random (the `secrets` module); there is no fixed prefix. Codes are made only by
the admin command (`python -m rahyaab_api.admin`, admin.py); the API never accepts a code it did not issue.

- Class code `AAA-XXX`: 24^3 x 32^3 = about 453 million codes. With the join limits (300 tries per IP per
  15 minutes), guessing one live code from one address takes, on average, months.
- Claim code `XXXX-XXXX`: 32^8 = about 1.1 x 10^12 codes, with 5 wrong tries per phone per hour.

Storage: only a keyed hash, HMAC-SHA256 with the server's CODE_PEPPER (settings.py), is kept
(school_class.code_hash, consent_slip.claim_code_hash); a code is shown once, when it is made. A plain
SHA-256 would not be enough: 453 million class codes can all be hashed in seconds, so anyone holding a copy
of the database could read every code back. Without the pepper, which never enters the database, they can't.
"""

import hashlib
import hmac
import secrets

LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"  # 24: no I, O
CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # 32: no I, O, 0, 1
MIN_PEPPER = 32


def _pick(alphabet: str, n: int) -> str:
    return "".join(secrets.choice(alphabet) for _ in range(n))


def new_class_code() -> str:
    return f"{_pick(LETTERS, 3)}-{_pick(CHARACTERS, 3)}"


def new_claim_code() -> str:
    return f"{_pick(CHARACTERS, 4)}-{_pick(CHARACTERS, 4)}"


def code_hash(code: str, pepper: str) -> str:
    """HMAC-SHA256 of a code under the server's pepper, as hex (what the database stores)."""
    if len(pepper) < MIN_PEPPER:
        raise ValueError("CODE_PEPPER must be set (at least 32 characters)")
    return hmac.new(pepper.encode("utf-8"), code.encode("ascii"), hashlib.sha256).hexdigest()
