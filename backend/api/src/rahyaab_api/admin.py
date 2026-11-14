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
    slips-print    --class ID --count N --out FOLDER [--kind parent|self] [--notice 2026-11]
                   writes two encrypted Excel files: the slip codes to print, and the class register
                   (form numbers filled in, checked columns for name, dates, band, research box)
    slip-record    --class ID --serial A-0001 --band 13-15 --by STAFF_ID [--research]
    students       --class ID [--out FOLDER]   nickname, consent-form number, consent, joined, last seen
                   (--out also writes it as an encrypted Excel file, to match with the register)
    student-remove --student ID --reason left|stranger|misuse|other
                   archives the student: off the class list, their phone stops working, nothing deleted
    student-restore --student ID               undoes student-remove (a never-consented profile can be
                   restored for 30 days; after that the purge deletes it)
    archived       --class ID                  archived students, the reason, and the deletion date
    device-block   (--device ID | --key-hash HASH) --reason TEXT   the phone can no longer join or sign in
    device-unblock --key-hash HASH
    limited-devices [--hours 24]               phones that hit the join limit (key hashes, for device-block)
    year-end       --school ID                 every class code of the school stops working (end of year)

How a teacher tells students apart: by the number of their consent form (A-0007), which the class list
shows next to the nickname. The school keeps the paper list of which student got which form; Rahyaab never
stores names or roll numbers, so a leaked database cannot name a child.

Environment: DATABASE_URL (a role that may write these tables, for example the migrator) and CODE_PEPPER
(the API's key for code hashes; it must be the same value the API uses). Every change is audit-logged.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from collections.abc import Callable
from datetime import date
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy import Connection, create_engine, text

from rahyaab_api import register
from rahyaab_api.codes import MIN_PEPPER, code_hash, new_claim_code, new_class_code
from rahyaab_api.ratelimit import digest

ACTOR = "admin-cli"
DEFAULT_CODE_DAYS = 120  # about one school term; rotate or extend at the start of the next one
SLIP_DAYS = 60  # unclaimed slips expire after 60 days (schema.sql)
PARENT_BANDS = ("13-15", "16-17")
ADULT_BANDS = ("18-19", "20-24", "25+")
REMOVE_REASONS = ("left", "stranger", "misuse", "other")


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


def class_label(conn: Connection, class_id: UUID) -> tuple[str, str]:
    """(school name, "9-A") for file names and headings."""
    row = conn.execute(
        text(
            "SELECT s.name, c.grade, c.section FROM school_class c JOIN school s ON s.id = c.school_id "
            "WHERE c.id = :c"
        ),
        {"c": class_id},
    ).one_or_none()
    if row is None:
        raise AdminError(f"no class {class_id}")
    return row.name, f"{row.grade}-{row.section}"


def _file_name(*parts: str) -> str:
    return "-".join(re.sub(r"[^A-Za-z0-9]+", "_", p).strip("_") for p in parts)


def _out_folder(value: str) -> Path:
    folder = Path(value)
    if not folder.is_dir():
        raise AdminError(f"the folder {folder} does not exist")
    return folder


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


# ----------------------------------------------------------------------------------------- students
def list_students(conn: Connection, class_id: UUID) -> list[dict[str, object]]:
    """The class list: nickname, consent-form number (how the teacher knows who is who), consent state."""
    _require_class(conn, class_id)
    rows = conn.execute(
        text(
            """
            SELECT st.id, st.nickname, st.created_at::date AS joined, st.last_active_at::date AS seen,
                   (SELECT cs.form_serial FROM consent co JOIN consent_slip cs ON cs.id = co.slip_id
                    WHERE co.student_id = st.id AND co.type IN ('parent', 'self')
                    ORDER BY co.id LIMIT 1) AS form,
                   CASE WHEN EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                                     AND co.type IN ('parent', 'self') AND co.withdrawn_at IS NULL)
                        THEN 'granted'
                        WHEN EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                                     AND co.type IN ('parent', 'self')) THEN 'withdrawn'
                        ELSE 'waiting' END AS consent,
                   (SELECT count(*) FROM device d WHERE d.student_id = st.id) AS phones
            FROM student st WHERE st.class_id = :c AND st.archived_at IS NULL
            ORDER BY lower(st.nickname)
            """
        ),
        {"c": class_id},
    ).all()
    return [dict(r._mapping) for r in rows]


def remove_student(conn: Connection, student_id: UUID, reason: str) -> None:
    """Takes a student off the class list by archiving them; nothing is deleted, so a mistake can be undone.

    While archived, the student's phone cannot sign in or upload (auth.py, the refresh route) and they use no
    seat. Their sign-ins are not cancelled, so student-restore brings them back exactly as they were. A
    never-consented archived profile is deleted 30 days after archiving (jobs.py); a consented one stays
    archived until the student or family asks for deletion (FR-10) or the retention job removes it (FR-84).
    To keep a misbehaving phone out for good, block it as well (device-block).
    """
    if reason not in REMOVE_REASONS:
        raise AdminError(f"--reason must be one of {', '.join(REMOVE_REASONS)}")
    done = conn.execute(
        text(
            "UPDATE student SET archived_at = now(), archived_reason = :r "
            "WHERE id = :s AND archived_at IS NULL RETURNING id"
        ),
        {"s": student_id, "r": reason},
    ).first()
    if done is None:
        exists = conn.execute(text("SELECT 1 FROM student WHERE id = :s"), {"s": student_id}).first()
        raise AdminError("that student is already archived" if exists else f"no student {student_id}")
    _audit(conn, f"student.archived.{reason}", f"student:{student_id}")


def restore_student(conn: Connection, student_id: UUID) -> None:
    """Undoes student-remove: back on the class list, and their phone works again without re-joining."""
    row = conn.execute(
        text("SELECT class_id, nickname, archived_at FROM student WHERE id = :s"), {"s": student_id}
    ).one_or_none()
    if row is None:
        raise AdminError(
            f"no student {student_id} (a never-consented profile is deleted 30 days after removal)"
        )
    if row.archived_at is None:
        raise AdminError("that student is not archived")
    clash = conn.execute(
        text(
            "SELECT 1 FROM student WHERE class_id = :c AND lower(nickname) = lower(:n) "
            "AND archived_at IS NULL AND id <> :s"
        ),
        {"c": row.class_id, "n": row.nickname, "s": student_id},
    ).first()
    if clash is not None:
        raise AdminError(
            "someone in the class took this nickname meanwhile; ask one of them to change it, then restore"
        )
    conn.execute(
        text("UPDATE student SET archived_at = NULL, archived_reason = NULL WHERE id = :s"), {"s": student_id}
    )
    _audit(conn, "student.restored", f"student:{student_id}")


def list_archived(conn: Connection, class_id: UUID) -> list[dict[str, object]]:
    """Archived students of a class, with the reason and when a never-consented one will be deleted."""
    _require_class(conn, class_id)
    rows = conn.execute(
        text(
            """
            SELECT st.id, st.nickname, st.archived_reason AS reason, st.archived_at::date AS archived,
                   CASE WHEN EXISTS (SELECT 1 FROM consent co WHERE co.student_id = st.id
                                     AND co.type IN ('parent', 'self'))
                        THEN NULL ELSE (st.archived_at + interval '30 days')::date END AS deleted_on
            FROM student st WHERE st.class_id = :c AND st.archived_at IS NOT NULL
            ORDER BY st.archived_at DESC
            """
        ),
        {"c": class_id},
    ).all()
    return [dict(r._mapping) for r in rows]


# ------------------------------------------------------------------------------------------ devices
def block_device(
    conn: Connection, reason: str, device_id: UUID | None = None, key_hash: str | None = None
) -> str:
    """Blocks a phone by its device row or by the key hash from `limited-devices`. Returns the key hash.

    The phone can no longer join (403 device_blocked) or refresh (its sign-ins are revoked now, and any
    later refresh is refused). The student's profile is not touched; use student-remove for that.
    """
    if not 1 <= len(reason) <= 200:
        raise AdminError("--reason must be 1 to 200 characters")
    if device_id is not None:
        public_key = conn.execute(
            text("SELECT public_key FROM device WHERE id = :d"), {"d": device_id}
        ).scalar_one_or_none()
        if public_key is None:
            raise AdminError(f"no device {device_id}")
        key_hash = digest(public_key)
    if not key_hash or len(key_hash) != 64:
        raise AdminError("give --device ID or a 64-character --key-hash")
    conn.execute(
        text(
            "INSERT INTO blocked_device (key_hash, reason, blocked_by) VALUES (:h, :r, :by) "
            "ON CONFLICT (key_hash) DO NOTHING"
        ),
        {"h": key_hash, "r": reason, "by": ACTOR},
    )
    conn.execute(
        text(
            "UPDATE refresh_token SET revoked_at = now() WHERE revoked_at IS NULL AND device_id IN "
            "(SELECT id FROM device WHERE encode(sha256(convert_to(public_key, 'UTF8')), 'hex') = :h)"
        ),
        {"h": key_hash},
    )
    _audit(conn, "device.blocked", f"device:{key_hash}")
    return key_hash


def unblock_device(conn: Connection, key_hash: str) -> None:
    gone = conn.execute(
        text("DELETE FROM blocked_device WHERE key_hash = :h RETURNING 1"), {"h": key_hash}
    ).first()
    if gone is None:
        raise AdminError("that phone is not blocked")
    _audit(conn, "device.unblocked", f"device:{key_hash}")


def limited_devices(conn: Connection, hours: int = 24) -> list[tuple[str, str, int, bool]]:
    """Phones that hit the join limit recently: (key hash, last time, windows, already blocked)."""
    rows = conn.execute(
        text(
            """
            SELECT l.key_hash, l.last, l.windows,
                   EXISTS (SELECT 1 FROM blocked_device b WHERE b.key_hash = l.key_hash) AS blocked
            FROM (SELECT substr(object, 8) AS key_hash, max(at) AS last, count(*) AS windows
                  FROM audit_log
                  WHERE action = 'join.device_limited' AND at > now() - make_interval(hours => :h)
                  GROUP BY 1) l
            ORDER BY l.windows DESC, l.last DESC
            """
        ),
        {"h": hours},
    ).all()
    return [(r.key_hash, r.last.isoformat(timespec="minutes"), int(r.windows), r.blocked) for r in rows]


# ---------------------------------------------------------------------------------------- year end
def year_end(conn: Connection, school_id: UUID) -> int:
    """Every class code of the school stops working. Students keep their profiles; at the yearly class
    check-in (FR-101) they move to their new class. Returns how many codes were still live."""
    live = conn.execute(
        text(
            "UPDATE school_class SET code_expires_at = now() "
            "WHERE school_id = :s AND code_expires_at > now() RETURNING id"
        ),
        {"s": school_id},
    ).all()
    _audit(conn, "school.year_end", f"school:{school_id}:{len(live)}")
    return len(live)


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
    s.add_argument("--out", required=True, help="an existing folder on this computer for the two files")
    s = sub.add_parser("slip-record")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s.add_argument("--serial", required=True)
    s.add_argument("--band", required=True, choices=PARENT_BANDS + ADULT_BANDS)
    s.add_argument("--by", required=True, type=UUID, help="the teacher's staff id")
    s.add_argument("--research", action="store_true", help="the family ticked the research box")
    s = sub.add_parser("students")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s.add_argument("--out", help="also write an encrypted Excel file into this existing folder")
    s = sub.add_parser("student-remove")
    s.add_argument("--student", required=True, type=UUID)
    s.add_argument("--reason", required=True, choices=REMOVE_REASONS)
    s = sub.add_parser("student-restore")
    s.add_argument("--student", required=True, type=UUID)
    s = sub.add_parser("archived")
    s.add_argument("--class", dest="class_id", required=True, type=UUID)
    s = sub.add_parser("device-block")
    target = s.add_mutually_exclusive_group(required=True)
    target.add_argument("--device", type=UUID, help="a device id (from the database)")
    target.add_argument("--key-hash", help="a key hash from limited-devices")
    s.add_argument("--reason", required=True)
    s = sub.add_parser("device-unblock")
    s.add_argument("--key-hash", required=True)
    s = sub.add_parser("limited-devices")
    s.add_argument("--hours", type=int, default=24)
    s = sub.add_parser("year-end")
    s.add_argument("--school", required=True, type=UUID)
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
        folder = _out_folder(a.out)
        school, class_name = class_label(conn, a.class_id)
        slips = print_slips(conn, pepper, a.class_id, a.count, a.kind, a.notice)
        # Written before the transaction commits: if a file can't be written, no slips are created.
        password = register.new_password()
        stamp = date.today().isoformat()
        first, final = slips[0][0], slips[-1][0]
        slip_file = register.save_encrypted(
            register.slips_workbook(school, class_name, slips),
            folder,
            _file_name(school, class_name, "slips", first, final, stamp),
            password,
        )
        register_file = register.save_encrypted(
            register.register_workbook(school, class_name, [s for s, _ in slips], a.kind),
            folder,
            _file_name(school, class_name, "register", first, final, stamp),
            password,
        )
        print(f"{len(slips)} slips, {first} to {final}. Two encrypted files:")
        print(f"  {slip_file}   print the slips from it, then delete it")
        print(f"  {register_file}   the class register; keep it at school")
        print(f"Password for both: {password}")
        print("Write the password in the school's staff record book now: it is shown only once.")
    elif a.command == "slip-record":
        record_slip(conn, a.class_id, a.serial, a.band, a.by, a.research)
        print(f"slip {a.serial} recorded with register band {a.band}")
    elif a.command == "students":
        rows = list_students(conn, a.class_id)
        print(
            f"{'nickname':<22}{'form':<9}{'family OK':<11}{'joined':<12}{'last seen':<12}"
            f"{'phones':<7}student id"
        )
        for r in rows:
            print(
                f"{r['nickname']!s:<22}{r['form'] or '-'!s:<9}{r['consent']!s:<11}{r['joined']!s:<12}"
                f"{r['seen']!s:<12}{r['phones']!s:<7}{r['id']}"
            )
        print(f"{len(rows)} students. Match form numbers with the school's own register.")
        if a.out:
            _, class_name = class_label(conn, a.class_id)
            password = register.new_password()
            path = register.save_encrypted(
                register.class_list_workbook(class_name, rows),
                _out_folder(a.out),
                _file_name(class_name, "class_list", date.today().isoformat()),
                password,
            )
            print(f"Encrypted file: {path}")
            print(f"Password: {password}   (shown only once)")
    elif a.command == "student-remove":
        remove_student(conn, a.student, a.reason)
        print(
            "Archived: off the class list, and their phone stops working. Nothing is deleted; undo with "
            "student-restore. To keep a phone out for good, also use device-block."
        )
    elif a.command == "student-restore":
        restore_student(conn, a.student)
        print("Restored: back on the class list, and their phone works again.")
    elif a.command == "archived":
        rows = list_archived(conn, a.class_id)
        for r in rows:
            gone = f"deleted on {r['deleted_on']}" if r["deleted_on"] else "kept (consented)"
            print(f"{r['nickname']!s:<22}{r['reason']!s:<10}archived {r['archived']}  {gone}  {r['id']}")
        print(f"{len(rows)} archived.")
    elif a.command == "device-block":
        key_hash = block_device(conn, a.reason, device_id=a.device, key_hash=a.key_hash)
        print(f"blocked phone {key_hash}: it can no longer join or sign in")
    elif a.command == "device-unblock":
        unblock_device(conn, a.key_hash)
        print("unblocked")
    elif a.command == "limited-devices":
        found = limited_devices(conn, a.hours)
        for key_hash, last, windows, blocked in found:
            print(f"{key_hash}  last {last}  limited {windows}x{'  (blocked)' if blocked else ''}")
        print(f"{len(found)} phones hit the join limit in the last {a.hours} hours.")
    elif a.command == "year-end":
        print(
            f"{year_end(conn, a.school)} class codes stopped. Make new ones with class-add or class-rotate."
        )


if __name__ == "__main__":
    sys.exit(main())
