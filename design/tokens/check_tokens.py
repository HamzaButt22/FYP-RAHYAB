"""Fail (exit 1) if tokens.css, theme.ts or tokens.dtcg.json drift from tokens.json (the master), or the app's copy
of theme.ts (frontend/mobile/src/theme/tokens.ts) differs from theme.ts. Run in CI."""
import json, pathlib, re, sys

D = pathlib.Path(__file__).parent
master = json.loads((D / "tokens.json").read_text(encoding="utf-8"))
css = (D / "tokens.css").read_text(encoding="utf-8")
ts = (D / "theme.ts").read_text(encoding="utf-8")
dtcg = json.loads((D / "tokens.dtcg.json").read_text(encoding="utf-8"))
camel = lambda n: re.sub(r"-(\w)", lambda m: m.group(1).upper(), n)
problems = []
for t in master["color"]["tokens"]:
    for theme, val in t["value"].items():
        if dtcg.get(theme, {}).get(t["name"], {}).get("$value", "").upper() != val.upper():
            problems.append(f"dtcg {theme}.{t['name']} != {val}")
        block = re.search(theme + r": \{(.*?)\n  \}", ts, re.S)
        if not block or f"{camel(t['name'])}: '{val}'" not in block.group(1):
            problems.append(f"theme.ts {theme}.{camel(t['name'])} != {val}")
        if f"--{t['name']}: {val};" not in css:
            problems.append(f"tokens.css --{t['name']} ({theme}) != {val}")
print("\n".join(problems) or "tokens in sync")
sys.exit(1 if problems else 0)
