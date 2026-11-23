"""Rahyaab developer commands. Works the same on Windows, macOS and Linux (standard library only).

    python tools/dev.py <command>

Local stack (Docker):  setup, db, migrate, roles, seed, reset, up, down, logs
Admin (local database): admin <command> ...   e.g. python tools/dev.py admin --help
Checks:                test, lint, check (everything CI runs that works offline)
Browser tests:         e2e (Playwright against the running stack; start it first with `up`)

VS Code runs these through Terminal -> Run Task (see .vscode/tasks.json).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
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
    # The key for class and claim code hashes (codes.py). Older .env files have no line for it yet.
    lines = env.read_text(encoding="utf-8").splitlines()
    pepper = [i for i, line in enumerate(lines) if line.startswith("CODE_PEPPER=")]
    if not pepper or lines[pepper[0]] == "CODE_PEPPER=":
        new = f"CODE_PEPPER={secrets.token_urlsafe(48)}"
        if pepper:
            lines[pepper[0]] = new
        else:
            lines.append(new)
        env.write_text("\n".join(lines) + "\n", encoding="utf-8")
        print("added a random CODE_PEPPER to infra/docker/.env (local only)")
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


def env_value(name: str) -> str:
    """A value from the local infra/docker/.env (created by setup)."""
    for line in (DOCKER / ".env").read_text(encoding="utf-8").splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    return ""


SEED_CODES = {  # psql variable -> development code (database/seed/dev_seed.sql)
    "h_class_9a": "RYB-4K2",
    "h_class_10b": "RYB-7Q9",
    "h_slip_2222": "DEVA-2222",
    "h_slip_3333": "DEVA-3333",
    "h_slip_4444": "DEVS-4444",
}


def seed() -> None:
    setup()  # makes sure the local CODE_PEPPER exists
    pepper = env_value("CODE_PEPPER").encode()
    sql = (ROOT / "database" / "seed" / "dev_seed.sql").read_bytes()
    args = ["exec", "-T", "db", "psql", "-q", "-v", "ON_ERROR_STOP=1", "-U", "rahyaab_admin", "-d", "rahyaab"]
    for var, code in SEED_CODES.items():  # the same keyed hash as rahyaab_api.codes.code_hash
        args += ["-v", f"{var}={hmac.new(pepper, code.encode(), hashlib.sha256).hexdigest()}"]
    compose(*args, stdin=sql)
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
    _pnpm("e2e", "install", "--frozen-lockfile")
    _pnpm("e2e", "typecheck")
    if api_is_up():
        e2e()
    else:
        print("\nbrowser tests skipped: the API is not running (start it with `python tools/dev.py up`)")
    if shutil.which("kubectl"):
        for overlay in ("staging", "production"):
            print(f"\n$ kubectl kustomize infra/k8s/overlays/{overlay}", flush=True)
            subprocess.run(["kubectl", "kustomize", f"infra/k8s/overlays/{overlay}"], cwd=ROOT, check=True,
                           stdout=subprocess.DEVNULL)
    print("\nall local checks passed")


def api_is_up(url: str = "http://localhost:8000/v1/health") -> bool:
    import urllib.request

    try:
        with urllib.request.urlopen(url, timeout=3) as answer:  # noqa: S310 - the local API only
            return bool(answer.status == 200)
    except OSError:
        return False


def e2e_seed() -> None:
    """Synthetic data for the browser tests (tools/e2e_seed.py). Playwright runs this before every suite."""
    env = {**os.environ, "PYTHONUTF8": "1"}
    env.setdefault("DATABASE_URL", f"postgresql+psycopg://rahyaab_admin:{DEV_PW}@127.0.0.1:5432/rahyaab")
    if not env.get("CODE_PEPPER"):
        setup()
        env["CODE_PEPPER"] = env_value("CODE_PEPPER")
    exe = shutil.which("uv") or "uv"
    code = subprocess.run([exe, "run", "python", str(ROOT / "tools" / "e2e_seed.py")], cwd=ROOT / "backend" / "api",
                          env=env).returncode
    if code:
        sys.exit(code)


def e2e() -> None:
    """The Playwright browser tests (frontend/e2e) against the API on :8000 and the dashboard dev server."""
    if not api_is_up():
        sys.exit("The API is not answering on http://localhost:8000. Start the stack: python tools/dev.py up")
    _pnpm("dashboard", "install", "--frozen-lockfile")
    _pnpm("e2e", "install", "--frozen-lockfile")
    _pnpm("e2e", "exec", "playwright", "install", "--only-shell", "chromium")
    _pnpm("e2e", "test")


def admin(args: list[str]) -> None:
    """Schools, licences, classes and codes in the LOCAL database (rahyaab_api/admin.py)."""
    setup()
    env = {
        **os.environ,
        "DATABASE_URL": f"postgresql+psycopg://rahyaab_admin:{DEV_PW}@127.0.0.1:5432/rahyaab",
        "CODE_PEPPER": env_value("CODE_PEPPER"),
    }
    exe = shutil.which("uv") or "uv"
    sys.exit(subprocess.run([exe, "run", "python", "-m", "rahyaab_api.admin", *args], cwd=ROOT / "backend" / "api",
                            env=env).returncode)


COMMANDS = {f.__name__: f for f in (setup, db, migrate, roles, seed, reset, up, down, logs, test, lint, check, e2e, e2e_seed)}

if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "admin":
        os.environ.setdefault("PYTHONUTF8", "1")
        admin(sys.argv[2:])
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(2)
    os.environ.setdefault("PYTHONUTF8", "1")
    COMMANDS[sys.argv[1]]()
