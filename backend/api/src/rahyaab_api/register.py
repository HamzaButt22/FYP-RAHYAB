"""Encrypted Excel files for the school: the slips to print, the teacher's register, and the class list.

Designed for minimum trust in whoever handles the files (SECURITY.md "Codes handed out on paper"):
- Every file is **encrypted** (Office Agile encryption: AES-256, SHA-512, 100,000 rounds, the same scheme
  Excel's "Encrypt with Password" uses). Nobody has to remember to protect it.
- The **password is generated**, never chosen: 20 random characters in groups (about 100 bits), from the
  alphabet without look-alikes, shown once. A weak or reused password is impossible.
- The register **checks what is typed**: dropdowns for the age band and the research box, real dates only,
  length limits, and the form numbers are locked so they can't be changed by accident. Anything typed that
  could run as a formula in Excel (starting with = + - @) is neutralised in every value we write.
- Files are written only to a folder that exists, never over an existing file, and a plain copy never
  touches the disk: the workbook is built and encrypted in memory.

The register holds children's names, so it never comes back to Rahyaab: the school keeps it. Rahyaab only
knows form numbers, which is how a teacher tells students apart on the class list.

A forgotten password must not lock the school out of its own register, so a **sealed copy of the password**
is kept on the server (`seal_password`, the `school_file` table): AES-256-GCM under a key derived from
CODE_PEPPER, which never enters the database, and bound to the file's id. An admin can open it again with
`admin.py file-password`, and every opening is audit-logged. Rahyaab holds the password, never the file.
"""

from __future__ import annotations

import io
import os
import secrets
from datetime import date
from pathlib import Path
from uuid import UUID

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from msoffcrypto.format.ooxml import OOXMLFile  # type: ignore[import-untyped]
from openpyxl import Workbook  # type: ignore[import-untyped]
from openpyxl.styles import Alignment, Font, PatternFill, Protection  # type: ignore[import-untyped]
from openpyxl.worksheet.datavalidation import DataValidation  # type: ignore[import-untyped]

from rahyaab_api.codes import CHARACTERS, MIN_PEPPER

SEAL_INFO = b"rahyaab-file-password-v1"  # separates this key from the code-hash use of the same pepper
NONCE_BYTES = 12
PARENT_BANDS = ("13-15", "16-17")
ADULT_BANDS = ("18-19", "20-24", "25+")
HEADER_FILL = PatternFill("solid", fgColor="EDE3D3")
FORMULA_START = ("=", "+", "-", "@", "\t", "\r")


def new_password() -> str:
    """20 random characters in five groups, like K7QP-M2XD-9RTV-H4NB-W8CA (about 100 bits)."""
    groups = ["".join(secrets.choice(CHARACTERS) for _ in range(4)) for _ in range(5)]
    return "-".join(groups)


def _seal_key(pepper: str) -> bytes:
    if len(pepper) < MIN_PEPPER:
        raise ValueError("CODE_PEPPER must be set (at least 32 characters)")
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=SEAL_INFO).derive(
        pepper.encode("utf-8")
    )


def seal_password(password: str, pepper: str, file_id: UUID) -> bytes:
    """The password encrypted for the server's backup: nonce + AES-256-GCM ciphertext, bound to `file_id`."""
    nonce = os.urandom(NONCE_BYTES)
    return nonce + AESGCM(_seal_key(pepper)).encrypt(nonce, password.encode("ascii"), file_id.bytes)


def open_password(sealed: bytes, pepper: str, file_id: UUID) -> str:
    """Reverses seal_password. Raises InvalidTag for another pepper, another file id or a changed row."""
    nonce, body = sealed[:NONCE_BYTES], sealed[NONCE_BYTES:]
    return AESGCM(_seal_key(pepper)).decrypt(nonce, body, file_id.bytes).decode("ascii")


def safe(value: object) -> object:
    """Neutralises text Excel would run as a formula (CSV/formula injection, OWASP)."""
    if isinstance(value, str) and value.startswith(FORMULA_START):
        return "'" + value
    return value


def _header(ws: object, titles: list[str], widths: list[int]) -> None:
    ws.append(titles)  # type: ignore[attr-defined]
    for i, width in enumerate(widths, start=1):
        cell = ws.cell(row=1, column=i)  # type: ignore[attr-defined]
        cell.font = Font(bold=True)
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(wrap_text=True, vertical="top")
        ws.column_dimensions[cell.column_letter].width = width  # type: ignore[attr-defined]
    ws.freeze_panes = "A2"  # type: ignore[attr-defined]


def _guide(wb: Workbook, lines: list[str]) -> None:
    guide = wb.create_sheet("How to use", 0)
    guide.column_dimensions["A"].width = 110
    for line in lines:
        guide.append([line])
    guide["A1"].font = Font(bold=True, size=14)
    guide.protection.sheet = True


def slips_workbook(school: str, class_name: str, slips: list[tuple[str, str]]) -> Workbook:
    """The slip codes to print, one per numbered form. Print, then delete this file."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Slips"
    _header(ws, ["Form number", "Slip code (print on the tear-off slip)"], [16, 40])
    for serial, code in slips:
        ws.append([safe(serial), safe(code)])
    ws.protection.sheet = True
    _guide(
        wb,
        [
            f"Consent slips: {school}, class {class_name}",
            "1. Print each slip code on the tear-off slip of the form with the same number.",
            "2. Give each student the form with their number, and write the number next to their name in the",
            "   class register (the other file). The student keeps the slip; the family signs the form.",
            "3. Delete this file after printing. A lost code is never looked up: print a new slip instead.",
        ],
    )
    return wb


def register_workbook(school: str, class_name: str, serials: list[str], kind: str) -> Workbook:
    """The teacher's class register: form numbers filled in, everything else checked as it is typed."""
    bands = PARENT_BANDS if kind == "parent" else ADULT_BANDS
    wb = Workbook()
    ws = wb.active
    ws.title = "Register"
    _header(
        ws,
        [
            "Form number",
            "Student name",
            "Roll number",
            "Form given (date)",
            "Signed form back (date)",
            "Age band (from the admission register)",
            "Research box ticked",
            "Teacher box ticked",
            "Notes",
        ],
        [14, 28, 14, 16, 18, 22, 14, 14, 36],
    )
    for serial in serials:
        ws.append([safe(serial)])
    last = len(serials) + 1
    for row in ws.iter_rows(min_row=2, max_row=last, min_col=2, max_col=9):
        for cell in row:
            cell.protection = Protection(locked=False)  # only the form numbers and headings are locked
    for row in ws.iter_rows(min_row=2, max_row=last, min_col=4, max_col=5):
        for cell in row:
            cell.number_format = "yyyy-mm-dd"

    def rule(dv: DataValidation, cols: str, title: str, message: str) -> None:
        dv.error, dv.errorTitle, dv.showErrorMessage, dv.errorStyle = message, title, True, "stop"
        dv.prompt, dv.promptTitle, dv.showInputMessage = message, title, True
        ws.add_data_validation(dv)
        for col in cols:
            dv.add(f"{col}2:{col}{last}")

    rule(
        DataValidation(type="textLength", operator="between", formula1="2", formula2="60"),
        "B",
        "Student name",
        "Type the name as in the school's admission register (2 to 60 characters).",
    )
    rule(
        DataValidation(type="textLength", operator="lessThanOrEqual", formula1="20"),
        "C",
        "Roll number",
        "Up to 20 characters.",
    )
    start, end = date(2025, 1, 1), date(2030, 12, 31)
    rule(
        DataValidation(
            type="date",
            operator="between",
            formula1=f"DATE({start.year},1,1)",
            formula2=f"DATE({end.year},12,31)",
        ),
        "DE",
        "Date",
        "Type a date, like 2026-11-20.",
    )
    rule(
        DataValidation(type="list", formula1='"' + ",".join(bands) + '"', allow_blank=True),
        "F",
        "Age band",
        "Pick the band from the school's admission register, not from what the student says.",
    )
    rule(
        DataValidation(type="list", formula1='"Yes,No"', allow_blank=True),
        "GH",
        "Research and teacher boxes",
        "Yes only if that box is ticked on the signed form (research box in G, teacher box in H).",
    )
    rule(
        DataValidation(type="textLength", operator="lessThanOrEqual", formula1="200"),
        "I",
        "Notes",
        "Up to 200 characters. No phone numbers or addresses.",
    )
    ws.protection.sheet = True
    ws.protection.formatColumns = False  # widths may still be adjusted
    form = "Form A (parent)" if kind == "parent" else "Form C (adult student)"
    _guide(
        wb,
        [
            f"Class register: {school}, class {class_name}, {form}",
            "This file stays at school: the only place a student's name is linked to their form number.",
            "Rahyaab never receives it. The app and the class list show nicknames and form numbers only.",
            "1. When you hand out a form, type the student's name and the date next to its number.",
            "2. When the signed form is back, type the date, the age band from the admission register and",
            "   whether the research and teacher boxes are ticked. Then record the slip in Rahyaab with the",
            "   same band and boxes. Without the teacher box, the student never appears on your dashboard.",
            "3. To find who a nickname is, look up its form number (shown on the class list) in this sheet.",
            "4. Keep this file only on the school's computer. Its password is in the staff record book.",
            "   If the password is lost, the Rahyaab admin can give it again (every request is logged).",
        ],
    )
    return wb


def class_list_workbook(class_name: str, rows: list[dict[str, object]]) -> Workbook:
    """The class list (nickname, form number, family OK) to match against the register by form number."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Class list"
    _header(ws, ["Nickname", "Form number", "Family OK", "Joined", "Last seen"], [24, 14, 12, 12, 12])
    for r in rows:
        ws.append([safe(r["nickname"]), safe(r["form"] or ""), r["consent"], r["joined"], r["seen"]])
    ws.protection.sheet = True
    _guide(
        wb,
        [
            f"Class list: class {class_name}",
            "Match each form number with the class register to see who is who.",
        ],
    )
    return wb


def save_encrypted(wb: Workbook, folder: Path, name: str, password: str) -> Path:
    """Encrypts in memory and writes `name`.xlsx into `folder`. Never overwrites a file."""
    if not folder.is_dir():
        raise FileNotFoundError(f"the folder {folder} does not exist")
    path = folder / f"{name}.xlsx"
    if path.exists():
        raise FileExistsError(f"{path} already exists; move it away first")
    plain = io.BytesIO()
    wb.save(plain)
    plain.seek(0)
    encrypted = io.BytesIO()
    OOXMLFile(plain).encrypt(password, encrypted)
    with path.open("xb") as out:  # "x": fail rather than overwrite, even in a race
        out.write(encrypted.getvalue())
    return path
