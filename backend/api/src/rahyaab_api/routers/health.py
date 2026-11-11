"""Liveness endpoint for Docker, Kubernetes and the external uptime monitor.

No version banner (docs/api/openapi.yaml `health`): the version would help an attacker match known flaws.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
