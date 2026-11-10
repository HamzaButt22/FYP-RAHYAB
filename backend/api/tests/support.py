"""Shared test helpers: device keys, and a throwaway school for the database tests.

The database tests need database/schema.sql applied and the api_rw role's password set:
    TEST_DATABASE_URL        the API's connection (role api_rw)
    TEST_ADMIN_DATABASE_URL  the admin connection, used only to create and remove test data
`python tools/dev.py test` sets both for the local Docker database. Without them those tests are skipped.
"""

import base64
import hashlib
import os
import secrets
import string
import uuid
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from sqlalchemy import Engine, text

from rahyaab_api.device_keys import refresh_message

JOIN_URL = "/v1/auth/student/join"
REFRESH_URL = "/v1/auth/refresh"
SIGNING_KEY = "test-signing-key-" + "k" * 32
API_URL = os.environ.get("TEST_DATABASE_URL", "")
ADMIN_URL = os.environ.get("TEST_ADMIN_DATABASE_URL", "")


def sha(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def make_device_key() -> tuple[str, ec.EllipticCurvePrivateKey]:
    """What the app does in the Android Keystore: an EC P-256 key; the public half as base64 DER."""
    private = ec.generate_private_key(ec.SECP256R1())
    der = private.public_key().public_bytes(Encoding.DER, PublicFormat.SubjectPublicKeyInfo)
    return base64.b64encode(der).decode(), private


def sign_refresh(private: ec.EllipticCurvePrivateKey, refresh_token: str) -> str:
    """What the app does to refresh: SHA256withECDSA over the context string and the token."""
    return base64.b64encode(private.sign(refresh_message(refresh_token), ec.ECDSA(hashes.SHA256()))).decode()


class World:
    """Creates a school with classes and staff for one test, and removes everything afterwards."""

    def __init__(self, admin: Engine) -> None:
        self.admin = admin
        self.school_id = uuid.uuid4()
        self.codes: list[str] = []
        self.keys: list[str] = []
        self.private_keys: dict[str, ec.EllipticCurvePrivateKey] = {}
        with admin.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO school (id, name, district, type, board) "
                    "VALUES (:id, 'Test', 'X', 'govt', 'FBISE')"
                ),
                {"id": self.school_id},
            )
            self.staff_id = conn.execute(
                text(
                    "INSERT INTO staff_user (school_id, email, password_hash, role) "
                    "VALUES (:s, :e, 'x', 'teacher') RETURNING id"
                ),
                {"s": self.school_id, "e": f"t-{self.school_id}@test.invalid"},
            ).scalar_one()
            # Start from zero for the TestClient's IP counters.
            conn.execute(
                text("DELETE FROM rate_limit WHERE key = ANY(:k)"),
                {"k": [f"join:ip:{sha('testclient')}", f"refresh:ip:{sha('testclient')}"]},
            )

    def new_code(self) -> str:
        alphabet = string.ascii_uppercase + string.digits
        code = "TST-" + "".join(secrets.choice(alphabet) for _ in range(3))
        self.codes.append(code)
        return code

    def add_class(self, grade: int = 9, expired: bool = False) -> tuple[uuid.UUID, str]:
        code = self.new_code()
        section = secrets.token_hex(2)
        with self.admin.begin() as conn:
            class_id = conn.execute(
                text(
                    "INSERT INTO school_class (school_id, grade, section, code_hash, code_expires_at) "
                    "VALUES (:s, :g, :sec, :h, now() + CASE WHEN :exp THEN interval '-1 day' "
                    "ELSE interval '30 days' END) RETURNING id"
                ),
                {"s": self.school_id, "g": grade, "sec": section, "h": sha(code), "exp": expired},
            ).scalar_one()
        return class_id, code

    def add_slip(self, class_id: uuid.UUID, research: bool = False, expired: bool = False) -> str:
        claim = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        claim = f"{claim[:4]}-{claim[4:]}"
        with self.admin.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO consent_slip (class_id, form_serial, claim_code_hash, research_opt_in, "
                    "notice_version, recorded_by, expires_at) VALUES (:c, :serial, :h, :r, '2026-11', :by, "
                    "now() + CASE WHEN :exp THEN interval '-1 day' ELSE interval '60 days' END)"
                ),
                {
                    "c": class_id,
                    "serial": secrets.token_hex(4),
                    "h": sha(claim),
                    "r": research,
                    "by": self.staff_id,
                    "exp": expired,
                },
            )
        return claim

    def device_key(self) -> str:
        public, private = make_device_key()
        self.keys.append(public)
        self.private_keys[public] = private
        return public

    def body(self, code: str, **overrides: Any) -> dict[str, Any]:
        body: dict[str, Any] = {
            "class_code": code,
            "grade": 9,
            "birth_year": 2011,
            "birth_month": 5,
            "nickname": "Ayesha_10",
            "lang": "ur",
            "device": {
                "device_tier": "low",
                "os_major": 13,
                "app_version": "0.1.0",
                "public_key": self.device_key(),
            },
        }
        body.update(overrides)
        return body

    def scalar(self, sql: str, **params: Any) -> Any:
        with self.admin.begin() as conn:
            return conn.execute(text(sql), params).scalar_one()

    def cleanup(self) -> None:
        keys = [f"join:dev:{sha(k)}" for k in self.keys] + [f"join:codefail:{sha(c)}" for c in self.codes]
        with self.admin.begin() as conn:
            conn.execute(
                text(
                    "DELETE FROM student WHERE class_id IN (SELECT id FROM school_class WHERE school_id = :s)"
                ),
                {"s": self.school_id},
            )
            conn.execute(text("DELETE FROM consent_slip WHERE recorded_by = :u"), {"u": self.staff_id})
            conn.execute(text("DELETE FROM staff_user WHERE id = :u"), {"u": self.staff_id})
            conn.execute(text("DELETE FROM school WHERE id = :s"), {"s": self.school_id})
            conn.execute(text("DELETE FROM rate_limit WHERE key = ANY(:k)"), {"k": keys})
