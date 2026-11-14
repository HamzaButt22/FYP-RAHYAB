"""Rahyaab developer commands. Works the same on Windows, macOS and Linux (standard library only).

    python tools/dev.py <command>

Local stack (Docker):  setup, db, migrate, roles, seed, reset, up, down, logs
Checks:                test, lint, check (everything CI runs that works offline)

VS Code runs these through Terminal -> Run Task (see .vscode/tasks.json).
"""

from __future__ import annotations

import base64
import os
import secrets
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCKER = ROOT / "infra" / "docker"
DEV_PW = "change-me-locally"  # local development only; never used outside your machine


def run(cmd: list[str], cwd: Path = ROOT, stdin: bytes | None = None, check: bool = True) -> int:
    print(f"\n$ {' '.join(cmd)}   (in {cwd.relative_to(ROOT) if cwd != ROOT else '.'})", flush=True)
    exe = shutil.which(cmd[0])  # resolves pnpm.cmd / npx.cmd on Windows
    result = subprocess.run([exe or cmd[0], *cmd[1:]], cwd=cwd, input=stdin)
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result.returncode


def compose(*args: str, stdin: bytes | None = None, check: bool = True) -> int:
    return run(["docker", "compose", "-p", "rahyaab-dev", *args], cwd=DOCKER, stdin=stdin, check=check)


def need(tool: str, hint: str) -> None:
    if shutil.which(tool) is None:
        sys.exit(f"'{tool}' was not found. {hint}")


# ------------------------------------------------------------------ local stack
def setup() -> None:
    """Create infra/docker/.env and the local secret files (only if they don't exist yet)."""
    env = DOCKER / ".env"
    if not env.exists():
        shutil.copyfile(DOCKER / ".env.example", env)
        print("created infra/docker/.env from .env.example (git-ignored)")
    # The API signs tokens even in development, so give the local .env a random signing key once.
    lines = env.read_text(encoding="utf-8").splitlines()
    if "JWT_SIGNING_KEY=" in lines:
        lines[lines.index("JWT_SIGNING_KEY=")] = f"JWT_SIGNING_KEY={secrets.token_urlsafe(48)}"
        env.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print("added a random JWT_SIGNING_KEY to infra/docker/.env (local only)")
    sec = DOCKER / "secrets"
    sec.mkdir(exist_ok=True)
    key = sec / "data_key_wrapper"
    if not key.exists():
        key.write_text(base64.b64encode(secrets.token_bytes(32)).decode() + "\n")
        print("created infra/docker/secrets/data_key_wrapper (random, local only)")
    (sec / "backup.env").touch(exist_ok=True)
    print("setup done")


def db() -> None:
    need("docker", "Install Docker Desktop and start it.")
    setup()
    compose("up", "-d", "db")
    for _ in range(60):
        if compose("exec", "-T", "db", "pg_isready", "-U", "rahyaab_admin", "-d", "rahyaab", check=False) == 0:
            print("database ready on localhost:5432")
            return
        time.sleep(2)
    sys.exit("the database did not become ready")


def migrate() -> None:
    db()
    compose("build", "api")  # the migrate service runs the API image
    compose("--profile", "migrate", "run", "--rm", "migrate")


def roles() -> None:
    sql = (ROOT / "database" / "set_role_passwords.sql").read_bytes()
    pw = [f"{v}={DEV_PW}" for v in ("api_pw", "jobs_pw", "research_pw", "guardian_pw")]
    args = ["exec", "-T", "db", "psql", "-q", "-v", "ON_ERROR_STOP=1", "-U", "rahyaab_admin", "-d", "rahyaab"]
    for p in pw:
        args += ["-v", p]
    compose(*args, stdin=sql)
    print("role passwords set (local development values)")


def seed() -> None:
    sql = (ROOT / "database" / "seed" / "dev_seed.sql").read_bytes()
    compose("exec", "-T", "db", "psql", "-q", "-v", "ON_ERROR_STOP=1", "-U", "rahyaab_admin", "-d", "rahyaab", stdin=sql)
    print("development seed loaded (class codes RYB-4K2 and RYB-7Q9; claim codes in database/seed/dev_seed.sql)")


def reset() -> None:
    """Delete the local database volume and rebuild it from scratch."""
    compose("down", "-v", check=False)
    migrate()
    roles()
    seed()


def up() -> None:
    migrate()
    roles()
    compose("up", "-d", "--build", "api", "jobs")
    print("\nAPI:  http://localhost:8000/v1/health   docs: http://localhost:8000/v1/docs")
    phone_reaches_api()


def phone_reaches_api() -> None:
    """Lets a connected emulator or USB phone reach the API at its own localhost:8000 (adb reverse).

    Docker publishes the API on 127.0.0.1 only, so the emulator's 10.0.2.2 alias cannot reach it, and the API
    is never exposed to the local network. Run `up` again after starting the emulator or plugging in a phone.
    """
    if not shutil.which("adb"):
        return
    devices = subprocess.run(["adb", "devices"], capture_output=True, text=True).stdout.splitlines()[1:]
    if not any(line.strip().endswith("device") for line in devices):
        print("No emulator or phone connected: start one, then run `python tools/dev.py up` again for the app.")
        return
    run(["adb", "reverse", "tcp:8000", "tcp:8000"], check=False)


def down() -> None:
    compose("down")


def logs() -> None:
    compose("logs", "-f", "--tail", "100", "api", "jobs", check=False)


# ------------------------------------------------------------------ checks
def _uv(pkg: str, *args: str) -> None:
    need("uv", "Install it: https://docs.astral.sh/uv/ (or: pip install uv).")
    run(["uv", "run", *args], cwd=ROOT / "backend" / pkg)


def _pnpm(app: str, *args: str) -> None:
    need("pnpm", "Install it: corepack enable pnpm (Node.js 24).")
    run(["pnpm", *args], cwd=ROOT / "frontend" / app)


def test() -> None:
    # The API's database tests use the local Docker database when it is running, and skip otherwise.
    os.environ.setdefault("TEST_DATABASE_URL", f"postgresql+psycopg://api_rw:{DEV_PW}@127.0.0.1:5432/rahyaab")
    os.environ.setdefault(
        "TEST_ADMIN_DATABASE_URL", f"postgresql+psycopg://rahyaab_admin:{DEV_PW}@127.0.0.1:5432/rahyaab"
    )
    for pkg in ("api", "scoring"):
        run(["uv", "sync", "--frozen"], cwd=ROOT / "backend" / pkg)
        _uv(pkg, "pytest", "-q", "-rs")
    _pnpm("dashboard", "install", "--frozen-lockfile")
    _pnpm("dashboard", "test")


def lint() -> None:
    for pkg in ("api", "scoring"):
        _uv(pkg, "ruff", "check", ".")
        _uv(pkg, "ruff", "format", "--check", ".")
        _uv(pkg, "mypy", "src")
    _pnpm("dashboard", "typecheck")
    _pnpm("mobile", "install", "--frozen-lockfile")
    _pnpm("mobile", "typecheck")
    _pnpm("mobile", "lint")
    _pnpm("mobile", "test")


def check() -> None:
    """Everything CI runs that works on your machine."""
    lint()
    test()
    run([sys.executable, "design/tokens/check_tokens.py"])
    run([sys.executable, "tools/docs_audit.py"])
    run([sys.executable, "tools/check_streams.py"])
    run([sys.executable, "tools/check_names.py"])
    if shutil.which("kubectl"):
        for overlay in ("staging", "production"):
            print(f"\n$ kubectl kustomize infra/k8s/overlays/{overlay}", flush=True)
            subprocess.run(["kubectl", "kustomize", f"infra/k8s/overlays/{overlay}"], cwd=ROOT, check=True,
                           stdout=subprocess.DEVNULL)
    print("\nall local checks passed")


COMMANDS = {f.__name__: f for f in (setup, db, migrate, roles, seed, reset, up, down, logs, test, lint, check)}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(2)
    os.environ.setdefault("PYTHONUTF8", "1")
    COMMANDS[sys.argv[1]]()
