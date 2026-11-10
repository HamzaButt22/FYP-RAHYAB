"""Device keys and refresh signatures without a database (ADR-0011)."""

import base64

from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from support import make_device_key, sign_refresh

from rahyaab_api.device_keys import load_public_key, verify_refresh_signature

SAMPLE = "a-refresh-token-0123456789abcdef"


def _b64_der(public_key: ec.EllipticCurvePublicKey | rsa.RSAPublicKey) -> str:
    der = public_key.public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
    return base64.b64encode(der).decode()


def test_a_p256_key_is_accepted() -> None:
    public, _ = make_device_key()
    assert load_public_key(public) is not None


def test_other_keys_and_garbage_are_refused() -> None:
    p384 = _b64_der(ec.generate_private_key(ec.SECP384R1()).public_key())
    rsa_key = _b64_der(rsa.generate_private_key(public_exponent=65537, key_size=2048).public_key())
    for value in (p384, rsa_key, "not base64 at all!", base64.b64encode(b"random bytes").decode(), ""):
        assert load_public_key(value) is None


def test_a_correct_signature_verifies() -> None:
    public, private = make_device_key()
    assert verify_refresh_signature(public, SAMPLE, sign_refresh(private, SAMPLE))


def test_signatures_are_bound_to_the_key_and_the_token() -> None:  # TC-SEC-18
    public, private = make_device_key()
    _, other_private = make_device_key()
    assert not verify_refresh_signature(public, SAMPLE, sign_refresh(other_private, SAMPLE))  # another device
    assert not verify_refresh_signature(public, SAMPLE, sign_refresh(private, SAMPLE + "x"))  # another token
    assert not verify_refresh_signature(public, SAMPLE, "bm90IGEgc2lnbmF0dXJl")  # not a signature
    assert not verify_refresh_signature(public, SAMPLE, "%%%")  # not base64
