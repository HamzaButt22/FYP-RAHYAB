"""Convert Apna Mela desktop assets to mobile-friendly formats (WebP images, AAC audio)."""
import os, subprocess, sys
from PIL import Image
SRC = sys.argv[1]; DST = sys.argv[2]
rules = {"backgrounds": (1600, 82), "stalls/bg_": (1600, 82), "characters/portrait": (320, 88),
         "characters": (760, 88), "story": (840, 85), "cards": (320, 88), "ui/logo": (900, 90)}
tot_in = tot_out = 0
for root, _, files in os.walk(os.path.join(SRC, "images")):
    for f in files:
        if not f.endswith(".png"):
            continue
        p = os.path.join(root, f); rel = os.path.relpath(p, os.path.join(SRC, "images"))
        out = os.path.join(DST, "images", rel[:-4] + ".webp"); os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(p); im.load()
        if im.mode not in ("RGBA", "RGB"):
            im = im.convert("RGBA")
        lim, q = 512, 90
        for k, v in rules.items():
            if rel.startswith(k):
                lim, q = v; break
        w, h = im.size
        sc = min(1.0, lim / max(w, h))
        if sc < 1:
            im = im.resize((round(w * sc), round(h * sc)), Image.LANCZOS)
        im.save(out, "WEBP", quality=q, method=6)
        tot_in += os.path.getsize(p); tot_out += os.path.getsize(out)
print("images", tot_in // 1024, "KB ->", tot_out // 1024, "KB")
for kind, br in (("music", "96k"), ("sfx", "96k")):
    d = os.path.join(SRC, "audio", kind); od = os.path.join(DST, "audio", kind); os.makedirs(od, exist_ok=True)
    for f in sorted(os.listdir(d)):
        out = os.path.join(od, f[:-4] + ".m4a")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(d, f), "-c:a", "aac", "-b:a", br, out], check=True)
print("audio done")
