"""The school's encrypted Excel files (register.py): encrypted, generated passwords, checked input."""

import io
import re
import uuid
from pathlib import Path

import msoffcrypto  # type: ignore[import-untyped]
import openpyxl  # type: ignore[import-untyped]
import pytest
from cryptography.exceptions import InvalidTag
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


class Operator:
    """Whoever runs the admin command: at a terminal, and types back `answers` when asked to confirm."""

    def __init__(
        self, monkeypatch: pytest.MonkeyPatch, password: str, answers: list[str] | None = None
    ) -> None:
        self.password = password
        self.answers = list(answers) if answers is not None else [password.rsplit("-", 1)[-1]]
        self.asked = 0
        monkeypatch.setattr(admin, "on_terminal", lambda: True)
        monkeypatch.setattr(register, "new_password", lambda: password)
        monkeypatch.setattr("builtins.input", self._input)

    def _input(self, _prompt: str = "") -> str:
        self.asked += 1
        return self.answers.pop(0) if self.answers else ""


@pytest.fixture
def env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    monkeypatch.setenv("DATABASE_URL", ADMIN_URL)
    monkeypatch.setenv("CODE_PEPPER", PEPPER)
    return monkeypatch


def _class(world: World, section: str) -> uuid.UUID:
    with world.admin.begin() as conn:
        class_id, _ = admin.add_class(conn, PEPPER, world.school_id, 9, section)
    world.class_ids.append(class_id)
    return class_id


COUNTS = {
    "consent_slip": "SELECT count(*) FROM consent_slip WHERE class_id = :c",
    "school_file": "SELECT count(*) FROM school_file WHERE class_id = :c",
}


def _count(world: World, table: str, class_id: uuid.UUID) -> int:
    return int(world.scalar(COUNTS[table], c=class_id))


def test_a_sealed_password_opens_only_with_the_same_pepper_and_file() -> None:
    password, file_id = register.new_password(), uuid.uuid4()
    sealed = register.seal_password(password, PEPPER, file_id)
    assert password.encode() not in sealed
    assert register.seal_password(password, PEPPER, file_id) != sealed  # a fresh nonce every time
    assert register.open_password(sealed, PEPPER, file_id) == password
    with pytest.raises(InvalidTag):
        register.open_password(sealed, "another-pepper-of-at-least-32-characters", file_id)
    with pytest.raises(InvalidTag):  # a sealed copy moved to another file's row does not open
        register.open_password(sealed, PEPPER, uuid.uuid4())
    with pytest.raises(ValueError):
        register.seal_password(password, "short", file_id)


def test_printing_slips_writes_both_files_and_shows_no_codes(
    world: World, tmp_path: Path, env: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    class_id = _class(world, "R1")
    operator = Operator(env, register.new_password())
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "3", "--out", str(tmp_path)]) == 0
    out = capsys.readouterr().out
    assert operator.asked == 1 and f"Password: {operator.password}" in out
    files = sorted(tmp_path.iterdir())
    assert len(files) == 2
    slips = open_encrypted(next(f for f in files if "slips" in f.name), operator.password)["Slips"]
    codes = [row[1].value for row in slips.iter_rows(min_row=2)]
    assert len(codes) == 3 and not any(code in out for code in codes)  # codes only inside the file
    reg = open_encrypted(next(f for f in files if "register" in f.name), operator.password)["Register"]
    assert [row[0].value for row in reg.iter_rows(min_row=2)] == ["A-0001", "A-0002", "A-0003"]


def test_a_failed_file_write_creates_no_slips(world: World, tmp_path: Path, env: pytest.MonkeyPatch) -> None:
    class_id = _class(world, "R2")
    Operator(env, register.new_password())
    missing = tmp_path / "not-there"
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "2", "--out", str(missing)]) == 1
    assert _count(world, "consent_slip", class_id) == 0


def test_without_a_terminal_nothing_is_made(
    world: World, tmp_path: Path, env: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    class_id = _class(world, "R3")  # pytest's captured output is not a terminal, like a pipe or a CI log
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "2", "--out", str(tmp_path)]) == 1
    assert "run this in a terminal" in capsys.readouterr().err
    assert list(tmp_path.iterdir()) == [] and _count(world, "consent_slip", class_id) == 0


def test_an_unconfirmed_password_removes_the_files_and_creates_nothing(
    world: World, tmp_path: Path, env: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    class_id = _class(world, "R4")
    operator = Operator(env, register.new_password(), answers=["ABCD", "", "XXXX"])
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "2", "--out", str(tmp_path)]) == 1
    assert operator.asked == admin.CONFIRM_TRIES
    assert "password not confirmed" in capsys.readouterr().err
    assert list(tmp_path.iterdir()) == []
    assert _count(world, "consent_slip", class_id) == 0 and _count(world, "school_file", class_id) == 0


def test_a_lost_password_can_be_shown_again_and_each_time_is_logged(
    world: World, tmp_path: Path, env: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    class_id = _class(world, "R5")
    operator = Operator(env, register.new_password())
    assert admin.main(["slips-print", "--class", str(class_id), "--count", "1", "--out", str(tmp_path)]) == 0
    with world.admin.connect() as conn:
        (listed,) = admin.list_files(conn, class_id)
        sealed = conn.execute(
            text("SELECT sealed_password FROM school_file WHERE id = :f"), {"f": listed["id"]}
        ).scalar_one()
    assert listed["kind"] == "slips_and_register" and "register" in str(listed["file_names"])
    assert operator.password.encode() not in bytes(sealed)  # the database holds only the sealed copy
    capsys.readouterr()
    operator.answers = [operator.password.rsplit("-", 1)[-1].lower()]  # lower case is accepted
    args = ["file-password", "--file", str(listed["id"]), "--reason", "lost"]
    assert admin.main(args) == 0
    assert f"Password: {operator.password}" in capsys.readouterr().out
    operator.answers = []  # not confirmed this time: still shown, still logged
    assert admin.main([*args[:-1], "new-teacher"]) == 0
    logged = world.scalar(
        "SELECT count(*) FROM audit_log WHERE object = :o AND action LIKE 'file.password_revealed.%'",
        o=f"school_file:{listed['id']}",
    )
    assert logged == 2
    with world.admin.connect() as conn:
        assert admin.list_files(conn, class_id)[0]["reveals"] == 2


def test_a_backup_needs_the_same_pepper_and_a_known_file(world: World) -> None:
    class_id = _class(world, "R6")
    with world.admin.begin() as conn:
        file_id = admin.save_file_password(
            conn, PEPPER, class_id, "class_list", [Path("x.xlsx")], "K7QP-M2XD"
        )
    with world.admin.begin() as conn, pytest.raises(admin.AdminError, match="CODE_PEPPER"):
        admin.reveal_file_password(conn, "another-pepper-of-at-least-32-characters", file_id, "lost")
    with world.admin.begin() as conn, pytest.raises(admin.AdminError, match="no file"):
        admin.reveal_file_password(conn, PEPPER, uuid.uuid4(), "lost")
    with world.admin.begin() as conn, pytest.raises(admin.AdminError, match="--reason"):
        admin.reveal_file_password(conn, PEPPER, file_id, "curious")


def test_the_class_list_file_is_backed_up_too(
    world: World, tmp_path: Path, env: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    class_id = _class(world, "R7")
    operator = Operator(env, register.new_password())
    assert admin.main(["students", "--class", str(class_id), "--out", str(tmp_path)]) == 0
    (path,) = tmp_path.iterdir()
    assert open_encrypted(path, operator.password)["Class list"]["A1"].value == "Nickname"
    with world.admin.connect() as conn:
        (listed,) = admin.list_files(conn, class_id)
        assert listed["kind"] == "class_list" and listed["file_names"] == path.name
        file_id = uuid.UUID(str(listed["id"]))
        assert admin.reveal_file_password(conn, PEPPER, file_id, "other") == operator.password
