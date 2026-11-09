"""Docs consistency audit: broken relative links and undefined FR, NFR, TC, ADR and RFC IDs.

Run: python tools/docs_audit.py   (exits 1 if anything is wrong; CI runs it on every PR)
"""
import pathlib, re, sys

R = pathlib.Path(__file__).resolve().parents[1]
md = [p for p in list((R / "docs").rglob("*.md")) + list((R / "design").rglob("*.md")) + list((R / "project-summary").rglob("*.md"))
      if "archive" not in p.parts and "research" not in p.parts]
srs = (R / "docs/project/SRS.md").read_text(encoding="utf-8")
tcs = (R / "docs/testing/TEST_CASES.md").read_text(encoding="utf-8")
screens_doc = (R / "docs/project/SCREENS.md").read_text(encoding="utf-8")

fr_def = set(re.findall(r"^\| (FR-\d+) \|", srs, re.M))
nfr_def = set(re.findall(r"^\| (NFR-\d+) \|", srs, re.M))
tc_def = set(re.findall(r"^\| (TC-[A-Z0-9]+-\d+) \|", tcs, re.M))
adr_def = {p.name[:8] for p in (R / "docs/architecture/adr").glob("ADR-*.md")}
rfc_def = {p.name[:8] for p in (R / "docs/architecture/rfc").glob("RFC-*.md")}
scr_def = set(re.findall(r"^\| ((?:S|P|D|A)-\d+[a-z]?) \|", screens_doc, re.M))
scr_def |= {re.match(r"((?:S|P|D|A|T)-\d+[a-z]?)", p.name).group(1) for p in (R / "design/screens").glob("*.html") if re.match(r"(S|P|D|A|T)-", p.name)}

def expand(prefix, a, b):
    return {f"{prefix}-{i:02d}" for i in range(int(a), int(b) + 1)}

problems = []
for p in md:
    s = p.read_text(encoding="utf-8")
    rel = p.relative_to(R)
    # links
    for m in re.finditer(r"\]\(([^)#\s]+)(#[^)]*)?\)", s):
        t = m.group(1)
        if t.startswith(("http", "mailto:")):
            continue
        if not (p.parent / t).exists():
            problems.append(f"LINK  {rel}: {t}")
    # FR / NFR single refs and ranges
    for kind, defs in (("FR", fr_def), ("NFR", nfr_def)):
        for m in re.finditer(rf"\b{kind}-(\d+)(?:\s*(?:–|-|to)\s*(?:{kind}-)?(\d+))?", s):
            a, b = m.group(1), m.group(2)
            ids = expand(kind, a, b) if b and int(b) > int(a) and int(b) - int(a) < 60 else {f"{kind}-{int(a):02d}"}
            for i in ids:
                if i not in defs:
                    problems.append(f"{kind:4}  {rel}: {i} (from '{m.group(0)}')")
    for m in re.finditer(r"\bTC-([A-Z0-9]+)-(\d+)(?:\s*(?:–|to)\s*(?:TC-[A-Z0-9]+-)?(\d+))?", s):
        fam, a, b = m.groups()
        ids = {f"TC-{fam}-{i:02d}" for i in range(int(a), int(b) + 1)} if b else {f"TC-{fam}-{int(a):02d}"}
        for i in ids:
            if i not in tc_def:
                problems.append(f"TC    {rel}: {i}")
    for m in re.finditer(r"\bADR-(\d{4})\b", s):
        if f"ADR-{m.group(1)}" not in adr_def:
            problems.append(f"ADR   {rel}: ADR-{m.group(1)}")
    for m in re.finditer(r"\bRFC-(\d{4})\b", s):
        if f"RFC-{m.group(1)}" not in rfc_def:
            problems.append(f"RFC   {rel}: RFC-{m.group(1)}")

print(f"FR {len(fr_def)} NFR {len(nfr_def)} TC {len(tc_def)} ADR {len(adr_def)} RFC {len(rfc_def)} screens {len(scr_def)}")
seen = set()
for x in problems:
    if x not in seen:
        seen.add(x); print(x)
print(len(seen), "problems")
sys.exit(1 if seen else 0)
