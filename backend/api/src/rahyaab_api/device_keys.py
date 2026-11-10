"""Device keys (ADR-0011): the app's Android Keystore key signs every refresh request.

Format, chosen to work on every Android version the app supports (the Keystore has Ed25519 only from
Android 13): an EC P-256 key pair. At join the app sends the public key as base64 of the DER
SubjectPublicKeyInfo (Java `PublicKey.getEncoded()`). To refresh, it signs the bytes
`rahyaab-refresh-v1:` + refresh_token with SHA256withECDSA and sends the DER signature in base64.
"""

import base64
import binascii

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import load_der_public_key

REFRESH_CONTEXT = b"rahyaab-refresh-v1:"


def _b64(value: str) -> bytes | None:
    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        return None


def load_public_key(value: str) -> ec.EllipticCurvePublicKey | None:
    """Returns the key if `value` is base64 DER of an EC P-256 public key, otherwise None."""
    der = _b64(value)
    if der is None:
        return None
    try:
        key = load_der_public_key(der)
    except ValueError:
        return None
    if isinstance(key, ec.EllipticCurvePublicKey) and isinstance(key.curve, ec.SECP256R1):
        return key
    return None


def refresh_message(refresh_token: str) -> bytes:
    return REFRESH_CONTEXT + refresh_token.encode("ascii")


def verify_refresh_signature(public_key: str, refresh_token: str, signature: str) -> bool:
    key = load_public_key(public_key)
    sig = _b64(signature)
    if key is None or sig is None:
        return False
    try:
        key.verify(sig, refresh_message(refresh_token), ec.ECDSA(hashes.SHA256()))
    except InvalidSignature:
        return False
    return True
