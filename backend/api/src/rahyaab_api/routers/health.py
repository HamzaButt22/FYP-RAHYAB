"""Liveness endpoint for Docker, Kubernetes and the external uptime monitor."""

from fastapi import APIRouter

from rahyaab_api import __version__

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}
