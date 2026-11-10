"""Student tokens (ADR-0011): a short-lived access JWT and a rotating, hashed refresh token."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from rahyaab_api.settings import Settings

ISSUER = "rahyaab-api"
ALGORITHM = "HS256"


def access_token(settings: Settings, student_id: UUID, device_id: UUID) -> str:
    now = datetime.now(UTC)
    claims = {
        "iss": ISSUER,
        "sub": str(student_id),
        "did": str(device_id),  # the device the token is bound to
        "typ": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(claims, settings.jwt_signing_key, algorithm=ALGORITHM)


def decode_access_token(settings: Settings, token: str) -> dict[str, object]:
    claims: dict[str, object] = jwt.decode(
        token,
        settings.jwt_signing_key,
        algorithms=[ALGORITHM],  # pinned: never trust the token's own "alg"
        issuer=ISSUER,
        options={"require": ["exp", "iat", "sub", "did"]},
    )
    if claims.get("typ") != "access":
        raise jwt.InvalidTokenError("not an access token")
    return claims


def new_refresh_token() -> tuple[str, str]:
    """Returns (token for the app, SHA-256 hash for the database). Only the hash is stored."""
    token = secrets.token_urlsafe(32)
    return token, hashlib.sha256(token.encode("ascii")).hexdigest()
