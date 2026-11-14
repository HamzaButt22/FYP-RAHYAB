"""The school's encrypted Excel files (register.py): encrypted, generated passwords, checked input."""

import io
import re
from pathlib import Path

import msoffcrypto  # type: ignore[import-untyped]
import openpyxl  # type: ignore[import-untyped]
import pytest
from msoffcrypto.exceptions import InvalidKeyError  # type: ignore[import-untyped]
from sqlalchemy import text
from support import ADMIN_URL, PEPPER, World

from rahyaab_api import admin, register

SLIPS = [("A-0001", "UBFD-49V4"), ("A-0002", "M7HQ-R7R3")]


def open_encrypted(path: Path, password: str) -> openpyxl.Workbook:
    with path.open("rb") as f:
        office = msoffcrypto.OfficeFile(f)
        office.load_key(password=password)
        plain = io.BytesIO()
        office.decrypt(plain)
    plain.seek(0)
    return openpyxl.load_workbook(plain)


def test_passwords_are_long_random_and_never_repeat() -> None:
    passwords = {register.new_password() for _ in range(500)}
    assert len(passwords) == 500
    assert all(re.fullmatch(r"([A-HJ-NP-Z2-9]{4}-){4}[A-HJ-NP-Z2-9]{4}", p) for p in passwords)


def test_files_are_encrypted_and_need_the_password(tmp_path: Path) -> None:
    password = register.new_password()
    path = register.save_encrypted(
        register.slips_workbook("Test School", "9-A", SLIPS), tmp_path, "s", password
    )
    raw = path.read_bytes()
    assert raw[:8] == bytes.fromhex("d0cf11e0a1b11ae1")  # an encrypted Office container, not a plain zip
    assert b"UBFD-49V4" not in raw
    with pytest.raises(InvalidKeyError):
        open_encrypted(path, "wrong-password")
    ws = open_encrypted(path, password)["Slips"]
    assert [[c.value for c in row] for row in ws.iter_rows(min_row=2)] == [list(s) for s in SLIPS]


def test_the_register_checks_what_is_typed(tmp_path: Path) -> None:
    password = register.new_password()
    wb = register.register_workbook("Test School", "9-A", ["A-0001", "A-0002"], "parent")
    ws = open_encrypted(register.save_encrypted(wb, tmp_path, "r", password), password)["Register"]
    assert ws["A2"].value == "A-0001" and ws["A3"].value == "A-0002"
    assert ws.protection.sheet  # form numbers and headings are locked ...
    assert ws["A2"].protection.locked and not ws["B2"].protection.locked  # ... the rest can be typed
    rules = {str(dv.sqref): dv for dv in ws.data_validations.dataValidation}
    assert rules["F2:F3"].formula1 == '"13-15,16-17"'  # Form A: only minor bands
    assert rules["G2:G3"].formula1 == '"Yes,No"'
    assert rules["B2:B3"].type == "textLength" and rules["D2:D3 E2:E3"].type == "date"
    assert all(dv.showErrorMessage and dv.errorStyle == "stop" for dv in rules.values())
    adult = register.register_workbook("Test School", "12-A", ["C-0001"], "self")
    bands = {str(dv.sqref): dv.formula1 for dv in adult["Register"].data_validations.dataValidation}
    assert bands["F2"] == '"18-19,20-24,25+"'  # Form C: only adult bands


def test_text_that_would_run_as_a_formula_is_neutralised() -> None:
    assert register.safe("=HYPERLINK(1)") == "'=HYPERLINK(1)"
    assert register.safe("+92 300") == "'+92 300"
    assert register.safe("@SUM") == "'@SUM"
    assert register.safe("Ali_10") == "Ali_10"


def test_files_never_overwrite_and_need_an_existing_folder(tmp_path: Path) -> None:
    wb = register.slips_workbook("S", "9-A", SLIPS)
    register.save_encrypted(wb, tmp_path, "same", register.new_password())
    with pytest.raises(FileExistsError):
        register.save_encrypted(wb, tmp_path, "same", register.new_password())
    with pytest.raises(FileNotFoundError):
        register.save_encrypted(wb, tmp_path / "missing", "x", register.new_password())


def test_printing_slips_writes_both_files_and_shows_no_codes(
    world: World, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    with world.admin.begin() as conn:
        class_id, _ = admin.add_class(conn, PEPPER, world.school_id, 9, "R1")
    world.class_ids.append(class_id)
    monkeypatch.setenv("DATABASE_URL", ADMIN_URL)
    monkeypatch.setenv("CODE_PEPPER", PEPPER)
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "3", "--out", str(tmp_path)]) == 0
    out = capsys.readouterr().out
    password = re.search(r"Password for both: (\S+)", out).group(1)  # type: ignore[union-attr]
    files = sorted(tmp_path.iterdir())
    assert len(files) == 2
    slips = open_encrypted(next(f for f in files if "slips" in f.name), password)["Slips"]
    codes = [row[1].value for row in slips.iter_rows(min_row=2)]
    assert len(codes) == 3 and not any(code in out for code in codes)  # codes only inside the file
    reg = open_encrypted(next(f for f in files if "register" in f.name), password)["Register"]
    assert [row[0].value for row in reg.iter_rows(min_row=2)] == ["A-0001", "A-0002", "A-0003"]


def test_a_failed_file_write_creates_no_slips(
    world: World, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    with world.admin.begin() as conn:
        class_id, _ = admin.add_class(conn, PEPPER, world.school_id, 9, "R2")
    world.class_ids.append(class_id)
    monkeypatch.setenv("DATABASE_URL", ADMIN_URL)
    monkeypatch.setenv("CODE_PEPPER", PEPPER)
    missing = tmp_path / "not-there"
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "2", "--out", str(missing)]) == 1
    with world.admin.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM consent_slip WHERE class_id = :c"), {"c": class_id})
        assert count.scalar_one() == 0
