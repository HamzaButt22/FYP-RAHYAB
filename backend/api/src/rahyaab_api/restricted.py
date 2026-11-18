"""Envelope encryption for restricted columns (docs/security/DATA_GOVERNANCE.md §4).

Each value gets its own random 256-bit data key. The value is encrypted with that key (AES-256-GCM, bound to
the row by `aad`, for example the staff id), and the data key is wrapped (AES-256-GCM) by the master key. The
master key is a file (`DATA_KEY_WRAPPER_FILE`, a Docker or Kubernetes secret holding 32 random bytes in
base64), never an environment variable and never in a backup, so a stolen database or backup cannot be
read. Used for staff authenticator keys (staff_user.mfa_secret_encrypted); guardian phones come later.

Stored layout: version (1 byte) | wrap nonce (12) | wrapped data key (32 + 16 tag) | nonce (12) | ciphertext.
The version is DATA_KEY_VERSION, so a new master key can be introduced and old rows re-wrapped (§5).
"""

from __future__ import annotations

import base64
import binascii
import os
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

VERSION = 1
_NONCE = 12
_WRAPPED = 32 + 16


class MasterKeyError(RuntimeError):
    """The master key file is missing or not 32 bytes of base64."""


def load_master_key(path: str) -> bytes:
    try:
        raw = Path(path).read_text(encoding="ascii").strip()
        key = base64.b64decode(raw, validate=True)
    except (OSError, ValueError, binascii.Error) as exc:
        raise MasterKeyError(f"the master key file cannot be read ({type(exc).__name__})") from None
    if len(key) != 32:
        raise MasterKeyError("the master key file must hold 32 bytes in base64")
    return key


def seal(plaintext: bytes, master_key: bytes, aad: bytes) -> bytes:
    data_key = AESGCM.generate_key(bit_length=256)
    wrap_nonce, nonce = os.urandom(_NONCE), os.urandom(_NONCE)
    wrapped = AESGCM(master_key).encrypt(wrap_nonce, data_key, bytes([VERSION]) + aad)
    return bytes([VERSION]) + wrap_nonce + wrapped + nonce + AESGCM(data_key).encrypt(nonce, plaintext, aad)


def open_sealed(sealed: bytes, master_key: bytes, aad: bytes) -> bytes:
    """Raises cryptography's InvalidTag for another master key, another row (aad) or a changed value."""
    if not sealed or sealed[0] != VERSION:
        raise ValueError("unknown sealed-value version")
    at = 1
    wrap_nonce = sealed[at : at + _NONCE]
    at += _NONCE
    wrapped = sealed[at : at + _WRAPPED]
    at += _WRAPPED
    nonce, body = sealed[at : at + _NONCE], sealed[at + _NONCE :]
    data_key = AESGCM(master_key).decrypt(wrap_nonce, wrapped, bytes([VERSION]) + aad)
    return AESGCM(data_key).decrypt(nonce, body, aad)
