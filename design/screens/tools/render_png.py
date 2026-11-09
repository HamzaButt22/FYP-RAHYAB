"""Render design/screens/*.html to PNG (@2x, light and dark) and the store screenshots, with a headless Chromium browser (Edge by default; set RAHYAAB_CHROME to use another)."""
import pathlib, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

import os
# Any Chromium browser works. Set RAHYAAB_CHROME to a Chrome, Chrome-for-Testing headless shell or Edge executable.
EDGE = os.environ.get("RAHYAAB_CHROME", r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
SCR = pathlib.Path(__file__).resolve().parents[1]
PNG = SCR / "png"; PNG.mkdir(exist_ok=True)
STORE_PNG = PNG / "store"; STORE_PNG.mkdir(exist_ok=True)
only = sys.argv[1:]


def shot(url, out, w, h, scale, crop=None):
    with tempfile.TemporaryDirectory() as prof:
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={prof}",
                        f"--force-device-scale-factor={scale}", f"--window-size={w},{h}", "--virtual-time-budget=6000",
                        f"--screenshot={out}", url], capture_output=True, timeout=120)
    if crop:
        im = Image.open(out); im.crop((0, 0, crop[0] * scale, crop[1] * scale)).save(out, optimize=True)


jobs = []
for f in sorted(SCR.glob("*.html")):
    if f.name == "index.html" or (only and not any(o in f.name for o in only)):
        continue
    if f.name.startswith(("D-", "A-")):
        w, h = 1280, 800
    elif f.name.startswith("T-"):
        w, h = 768, 1024
    else:
        w, h = 390, 844
    for theme in ("light", "dark"):
        url = f.as_uri() + f"?theme={theme}"
        jobs.append((url, str(PNG / f"{f.stem}-{theme}.png"), max(w, 500), h, 2, (w, h)))
if not only or "store" in only:
    for f in sorted((SCR / "store").glob("*.html")):
        jobs.append((f.as_uri(), str(STORE_PNG / f"{f.stem}.png"), 1080, 1920, 1, None))

with ThreadPoolExecutor(6) as ex:
    list(ex.map(lambda j: shot(*j), jobs))
print(len(jobs), "rendered")
