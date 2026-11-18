"""Staff sign-in building blocks (FR-71, FR-106, NFR-40): passwords, one-time codes, sealed secrets, CSRF.

Pure functions; no database needed.
"""

import base64
import re
import uuid

import pytest
from cryptography.exceptions import InvalidTag

from rahyaab_api import restricted
from rahyaab_api import staff_auth as sa

MASTER = bytes(range(32))


def test_passwords_are_argon2id_and_verify() -> None:
    stored = sa.hash_password("a long enough passphrase")
    assert stored.startswith("$argon2id$")
    assert sa.verify_password(stored, "a long enough passphrase")
    assert not sa.verify_password(stored, "a long enough passphrasE")


def test_an_unusable_hash_never_verifies() -> None:
    # Accounts made by the admin command have no password until the invite link is used.
    assert not sa.verify_password(sa.NO_PASSWORD, "")
    assert not sa.verify_password(sa.NO_PASSWORD, "anything at all here")
    assert not sa.verify_password("x", "anything at all here")


def test_password_policy() -> None:
    email = "sana.teacher@school.pk"
    assert sa.password_problems("short", email) == ["too_short"]
    assert sa.password_problems("x" * 129, email) == ["too_long"]
    assert sa.password_problems("password1234", email) == ["common"]
    assert sa.password_problems("Password1234", email) == ["common"]  # case does not help
    assert sa.password_problems("my sana.teacher pass", email) == ["contains_email"]
    assert sa.password_problems("green tea at four", email) == []


def test_link_tokens_match_the_contract_and_only_the_digest_is_stored() -> None:
    token = sa.new_link_token()
    assert re.fullmatch(r"[0-9A-Za-z]{22}", token)  # docs/api/openapi.yaml, about 131 bits
    assert sa.new_link_token() != token
    assert sa.token_digest(token) == sa.token_digest(token)
    assert token not in sa.token_digest(token)


def test_totp_matches_rfc_6238() -> None:
    # RFC 6238 appendix B, SHA-1, the first 6 of the 8 digits shown there: T = 59 s -> 94287082.
    secret = b"12345678901234567890"
    assert sa.totp_at(secret, 59 // 30) == "287082"
    assert sa.totp_at(secret, 1111111109 // 30) == "081804"


def test_tc_sec_21_totp_accepts_one_step_either_side_and_never_a_used_step() -> None:
    secret = sa.new_totp_secret()
    now = 1_800_000_000.0
    step = int(now // 30)
    assert sa.match_totp(secret, sa.totp_at(secret, step), now, None) == step
    assert sa.match_totp(secret, sa.totp_at(secret, step - 1), now, None) == step - 1
    assert sa.match_totp(secret, sa.totp_at(secret, step + 1), now, None) == step + 1
    assert sa.match_totp(secret, sa.totp_at(secret, step + 2), now, None) is None
    # Replay: a code from a step already used (or older) is refused.
    assert sa.match_totp(secret, sa.totp_at(secret, step), now, step) is None
    assert sa.match_totp(secret, sa.totp_at(secret, step - 1), now, step) is None
    assert sa.match_totp(secret, sa.totp_at(secret, step + 1), now, step) == step + 1


def test_setup_key_and_link_for_authenticator_apps() -> None:
    secret = sa.new_totp_secret()
    assert len(secret) == 20
    key = sa.setup_key(secret)
    assert re.fullmatch(r"[A-Z2-7]{32}", key)  # base32, no padding, typed by hand if needed
    uri = sa.otpauth_uri(secret, "sana@school.pk")
    assert uri.startswith("otpauth://totp/Rahyaab:sana%40school.pk?")
    assert f"secret={key}" in uri and "issuer=Rahyaab" in uri


def test_tc_sec_23_sealed_secrets_open_only_for_the_same_staff_member() -> None:
    secret, staff = sa.new_totp_secret(), uuid.uuid4()
    sealed = sa.seal_secret(secret, MASTER, staff)
    assert secret not in sealed and sealed[0] == restricted.VERSION
    assert sa.seal_secret(secret, MASTER, staff) != sealed  # a new data key and nonces every time
    assert sa.open_secret(sealed, MASTER, staff) == secret
    with pytest.raises(InvalidTag):
        sa.open_secret(sealed, MASTER, uuid.uuid4())
    with pytest.raises(InvalidTag):
        sa.open_secret(sealed, bytes(32), staff)
    tampered = sealed[:-1] + bytes([sealed[-1] ^ 1])
    with pytest.raises(InvalidTag):
        sa.open_secret(tampered, MASTER, staff)


def test_the_master_key_file_must_hold_32_bytes(tmp_path) -> None:  # type: ignore[no-untyped-def]
    good = tmp_path / "key"
    good.write_text(base64.b64encode(MASTER).decode() + "\n")
    assert restricted.load_master_key(str(good)) == MASTER
    short = tmp_path / "short"
    short.write_text(base64.b64encode(bytes(16)).decode())
    for path in (str(short), str(tmp_path / "missing")):
        with pytest.raises(restricted.MasterKeyError):
            restricted.load_master_key(path)


def test_passwords_use_the_documented_argon2_settings() -> None:
    # DATA_GOVERNANCE.md §4: memory 64 MB, 3 iterations, parallelism 1.
    assert "$m=65536,t=3,p=1$" in sa.hash_password("a long enough passphrase")


def test_tc_sec_22_csrf_token_is_tied_to_the_session() -> None:
    a, b = uuid.uuid4(), uuid.uuid4()
    key = "k" * 40
    assert sa.csrf_for(key, a) == sa.csrf_for(key, a)
    assert sa.csrf_for(key, a) != sa.csrf_for(key, b)
    assert sa.csrf_for(key, a) != sa.csrf_for("j" * 40, a)


def test_lockout_grows_and_is_capped() -> None:
    assert sa.lockout_minutes(4) == 0
    assert sa.lockout_minutes(5) == 15
    assert sa.lockout_minutes(6) == 30
    assert sa.lockout_minutes(7) == 60
    assert sa.lockout_minutes(30) == 24 * 60
