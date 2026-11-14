"""Admin command for schools, licences, classes, class codes and consent slips (FR-80, FR-05a, FR-107).

This is the only place real codes are made (codes.py). The API accepts a class or claim code only if it
matches one made here and has not expired; nothing else works, whatever its shape. Each code is printed
once, when it is made, and only its keyed hash is stored, so a lost code is replaced, never looked up.
The dashboard screens for the same jobs come in FYP-2 (A-01, D-11).

    python -m rahyaab_api.admin <command> [options]          (or: python tools/dev.py admin <command> ...)

Commands:
    school-add     --name --district --type govt|private|chain --board
    licence-add    --school ID --kind pilot|institution --until YYYY-MM-DD [--seats N]
    class-add      --school ID --grade 8-12 --section A [--days 120]          prints the class code
    class-rotate   --class ID [--days 120]     a new code; the old one stops at once; joined students stay
    class-expire   --class ID                  the code stops working now (end of term, or a leaked code)
    classes        --school ID                 grade, section and code expiry (codes cannot be shown again)
    slips-print    --class ID --count N [--kind parent|self] [--notice 2026-11]  serials and claim codes
    slip-record    --class ID --serial A-0001 --band 13-15 --by STAFF_ID [--research]

Environment: DATABASE_URL (a role that may write these tables, for example the migrator) and CODE_PEPPER
(the API's key for code hashes; it must be the same value the API uses). Every change is audit-logged.
"""

from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Callable
from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Connection, create_engine, text

from rahyaab_api.codes import MIN_PEPPER, code_hash, new_claim_code, new_class_code

ACTOR = "admin-cli"
DEFAULT_CODE_DAYS = 120  # about one school term; rotate or extend at the start of the next one
SLIP_DAYS = 60  # unclaimed slips expire after 60 days (schema.sql)
PARENT_BANDS = ("13-15", "16-17")
ADULT_BANDS = ("18-19", "20-24", "25+")


class AdminError(Exception):
    """A request the admin can fix (shown as one line, no traceback)."""


def _audit(conn: Connection, action: str, obj: str) -> None:
    conn.execute(
        text("INSERT INTO audit_log (actor, action, object) VALUES (:a, :act, :o)"),
        {"a": ACTOR, "act": action, "o": obj},
    )


# ------------------------------------------------------------------------------------------ schools
def add_school(conn: Connection, name: str, district: str, school_type: str, board: str) -> UUID:
    school_id: UUID = conn.execute(
        text("INSERT INTO school (name, district, type, board) VALUES (:n, :d, :t, :b) RETURNING id"),
        {"n": name, "d": district, "t": school_type, "b": board},
    ).scalar_one()
    _audit(conn, "school.add", f"school:{school_id}")
    return school_id


def add_licence(conn: Connection, school_id: UUID, kind: str, until: date, seats: int | None) -> UUID:
    if kind not in ("pilot", "institution"):
        raise AdminError("a school licence is 'pilot' or 'institution'")
    licence_id: UUID = conn.execute(
        text(
            "INSERT INTO licence (kind, school_id, seats, ends_at) "
            "VALUES (:k, :s, :seats, CAST(:until AS date) + interval '1 day') RETURNING id"
        ),
        {"k": kind, "s": school_id, "seats": seats, "until": until.isoformat()},
    ).scalar_one()
    _audit(conn, "licence.add", f"licence:{licence_id}")
    return licence_id


# ------------------------------------------------------------------------------------------ classes
def _insert_unique(
    conn: Connection, sql: str, params: dict[str, object], make: Callable[[], str], pepper: str
) -> str:
    """Draws codes until one is unused (a repeat is very unlikely, but code_hash is UNIQUE)."""
    for _ in range(5):
        code = make()
        found = conn.execute(
            text(
                "SELECT 1 FROM school_class WHERE code_hash = :h UNION ALL "
                "SELECT 1 FROM consent_slip WHERE claim_code_hash = :h"
            ),
            {"h": code_hash(code, pepper)},
        ).first()
        if found is None:
            conn.execute(text(sql), {**params, "h": code_hash(code, pepper)})
            return code
    raise AdminError("could not draw an unused code; try again")


def add_class(
    conn: Connection, pepper: str, school_id: UUID, grade: int, section: str, days: int = DEFAULT_CODE_DAYS
) -> tuple[UUID, str]:
    """Creates a class and returns (class id, class code). The code is never shown again."""
    if not 1 <= days <= 365:
        raise AdminError("--days must be 1 to 365")
    class_id = uuid4()
    code = _insert_unique(
        conn,
        "INSERT INTO school_class (id, school_id, grade, section, code_hash, code_expires_at) "
        "VALUES (:id, :s, :g, :sec, :h, now() + make_interval(days => :days))",
        {"id": class_id, "s": school_id, "g": grade, "sec": section, "days": days},
        new_class_code,
        pepper,
    )
    _audit(conn, "class.add", f"class:{class_id}")
    return class_id, code


def rotate_class_code(conn: Connection, pepper: str, class_id: UUID, days: int = DEFAULT_CODE_DAYS) -> str:
    """A new code for the class. The old code stops working at once; students who joined stay (FR-80)."""
    if not 1 <= days <= 365:
        raise AdminError("--days must be 1 to 365")
    _require_class(conn, class_id)
    code = _insert_unique(
        conn,
        "UPDATE school_class SET code_hash = :h, code_expires_at = now() + make_interval(days => :days) "
        "WHERE id = :id",
        {"id": class_id, "days": days},
        new_class_code,
        pepper,
    )
    _audit(conn, "class.code_rotated", f"class:{class_id}")
    return code


def expire_class_code(conn: Connection, class_id: UUID) -> None:
    _require_class(conn, class_id)
    conn.execute(text("UPDATE school_class SET code_expires_at = now() WHERE id = :id"), {"id": class_id})
    _audit(conn, "class.code_expired", f"class:{class_id}")


def list_classes(conn: Connection, school_id: UUID) -> list[tuple[str, str, str, bool]]:
    rows = conn.execute(
        text(
            "SELECT id, grade, section, code_expires_at, code_expires_at > now() AS live "
            "FROM school_class WHERE school_id = :s ORDER BY grade, section"
        ),
        {"s": school_id},
    ).all()
    return [(str(r.id), f"{r.grade}-{r.section}", r.code_expires_at.date().isoformat(), r.live) for r in rows]


def _require_class(conn: Connection, class_id: UUID) -> None:
    if conn.execute(text("SELECT 1 FROM school_class WHERE id = :id"), {"id": class_id}).first() is None:
        raise AdminError(f"no class {class_id}")


# ------------------------------------------------------------------------------------- consent slips
def print_slips(
    conn: Connection, pepper: str, class_id: UUID, count: int, kind: str = "parent", notice: str = "2026-11"
) -> list[tuple[str, str]]:
    """Numbered slips for the paper forms (Form A parent, Form C adult): [(serial, claim code)].

    Print each pair on its form. The codes are not shown again; a lost one is replaced by a new slip.
    """
    if not 1 <= count <= 200:
        raise AdminError("--count must be 1 to 200")
    if kind not in ("parent", "self"):
        raise AdminError("--kind is 'parent' (Form A) or 'self' (Form C)")
    _require_class(conn, class_id)
    prefix = "A" if kind == "parent" else "C"
    used = conn.execute(
        text("SELECT count(*) FROM consent_slip WHERE class_id = :c AND form_serial LIKE :p"),
        {"c": class_id, "p": f"{prefix}-%"},
    ).scalar_one()
    slips = []
    for n in range(int(used) + 1, int(used) + count + 1):
        serial = f"{prefix}-{n:04d}"
        code = _insert_unique(
            conn,
            "INSERT INTO consent_slip "
            "(class_id, kind, form_serial, claim_code_hash, notice_version, expires_at) "
            "VALUES (:c, :k, :serial, :h, :notice, now() + make_interval(days => :days))",
            {"c": class_id, "k": kind, "serial": serial, "notice": notice, "days": SLIP_DAYS},
            new_claim_code,
            pepper,
        )
        slips.append((serial, code))
    _audit(conn, "slips.print", f"class:{class_id}:{count}")
    return slips


def record_slip(
    conn: Connection, class_id: UUID, serial: str, band: str, staff_id: UUID, research: bool = False
) -> None:
    """The signed form is back: the teacher copies the age band from the school's admission register."""
    slip = conn.execute(
        text("SELECT id, kind, recorded_at FROM consent_slip WHERE class_id = :c AND form_serial = :s"),
        {"c": class_id, "s": serial},
    ).one_or_none()
    if slip is None:
        raise AdminError(f"no slip {serial} in that class")
    if slip.recorded_at is not None:
        raise AdminError(f"slip {serial} is already recorded")
    allowed = PARENT_BANDS if slip.kind == "parent" else ADULT_BANDS
    if band not in allowed:
        form = "Form A (parent)" if slip.kind == "parent" else "Form C (adult)"
        raise AdminError(f"{form} needs a register band of {', '.join(allowed)}")
    staff_ok = conn.execute(
        text(
            "SELECT 1 FROM staff_user st JOIN school_class c ON c.id = :c "
            "WHERE st.id = :by AND st.disabled_at IS NULL "
            "AND (st.school_id = c.school_id OR st.role = 'admin')"
        ),
        {"c": class_id, "by": staff_id},
    ).first()
    if staff_ok is None:
        raise AdminError("--by must be an active staff member of this school")
    conn.execute(
        text(
            "UPDATE consent_slip SET recorded_by = :by, recorded_at = now(), verified_age_band = :b, "
            "research_opt_in = :r WHERE id = :id"
        ),
        {"by": staff_id, "b": band, "r": research, "id": slip.id},
    )
    _audit(conn, "slip.record", f"slip:{slip.id}")


# ---------------------------------------------------------------------------------------------- CLI
def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="python -m rahyaab_api.admin", description=__doc__.split("\n\n")[0])
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("school-add")
    s.add_argument("--name", required=True)
    s.add_argument("--district", required=True)
    s.add_argument("--type", required=True, choices=["govt", "private", "chain"])
    s.add_argument("--board", required=True)
    s = sub.add_parser("licence-add")
    s.add_argument("--school", required=True, type=UUID)
    s.add_argument("--kind", required=True, choices=["pilot", "institution"])
    s.add_argument("--until", required=True, type=date.fromisoformat, help="last day, YYYY-MM-DD")
    s.add_argument("--seats", type=int, help="leave out for unlimited (pilot)")
    s = sub.add_parser("class-add")
    s.add_argument("--school", required=True, type=UUID)
    s.add_argument("--grade", required=True, type=int, choices=range(8, 13))
    s.add_argument("--section", required=True)
    s.add_argument("--days", type=int, default=DEFAULT_CODE_DAYS)
    s = sub.add_parser("class-rotate")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s.add_argument("--days", type=int, default=DEFAULT_CODE_DAYS)
    s = sub.add_parser("class-expire")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s = sub.add_parser("classes")
    s.add_argument("--school", required=True, type=UUID)
    s = sub.add_parser("slips-print")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s.add_argument("--count", required=True, type=int)
    s.add_argument("--kind", default="parent", choices=["parent", "self"])
    s.add_argument("--notice", default="2026-11", help="version of the privacy notice printed on the form")
    s = sub.add_parser("slip-record")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s.add_argument("--serial", required=True)
    s.add_argument("--band", required=True, choices=PARENT_BANDS + ADULT_BANDS)
    s.add_argument("--by", required=True, type=UUID, help="the teacher's staff id")
    s.add_argument("--research", action="store_true", help="the family ticked the research box")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    url, pepper = os.environ.get("DATABASE_URL", ""), os.environ.get("CODE_PEPPER", "")
    if not url:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 2
    if len(pepper) < MIN_PEPPER:
        print("CODE_PEPPER is not set (it must be the API's value)", file=sys.stderr)
        return 2
    engine = create_engine(url)
    try:
        with engine.begin() as conn:
            _run(conn, pepper, args)
    except AdminError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()
    return 0


def _run(conn: Connection, pepper: str, a: argparse.Namespace) -> None:
    once = "Write it down now: it is shown only once."
    if a.command == "school-add":
        print(f"school id: {add_school(conn, a.name, a.district, a.type, a.board)}")
    elif a.command == "licence-add":
        print(f"licence id: {add_licence(conn, a.school, a.kind, a.until, a.seats)}")
    elif a.command == "class-add":
        class_id, code = add_class(conn, pepper, a.school, a.grade, a.section, a.days)
        print(f"class id:   {class_id}\nclass code: {code}   (valid {a.days} days)\n{once}")
    elif a.command == "class-rotate":
        print(
            f"new class code: {rotate_class_code(conn, pepper, a.class_id, a.days)}\n"
            f"The old code no longer works; students who joined are not affected. {once}"
        )
    elif a.command == "class-expire":
        expire_class_code(conn, a.class_id)
        print("The class code no longer works. Students who joined are not affected.")
    elif a.command == "classes":
        for listed_id, name, expires, live in list_classes(conn, a.school):
            print(f"{listed_id}  class {name:<6} code {'live until' if live else 'expired'} {expires}")
    elif a.command == "slips-print":
        print("serial,claim_code")
        for serial, code in print_slips(conn, pepper, a.class_id, a.count, a.kind, a.notice):
            print(f"{serial},{code}")
        print(f"# Print each claim code on its numbered form. {once}", file=sys.stderr)
    elif a.command == "slip-record":
        record_slip(conn, a.class_id, a.serial, a.band, a.by, a.research)
        print(f"slip {a.serial} recorded with register band {a.band}")


if __name__ == "__main__":
    sys.exit(main())
