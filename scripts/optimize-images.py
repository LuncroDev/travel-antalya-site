#!/usr/bin/env python3
"""Create fast-loading WebP copies of site photos.

Usage: python3 scripts/optimize-images.py [--recompress]
Writes images/opt/<name>-640.webp and <name>-1280.webp for every photo in the
source folders. Existing outputs are skipped, so it is safe to run after adding
new photos (the daily content workflow runs it before committing).

Each copy is kept under a byte budget (BUDGET): busy photos are re-saved at a
lower quality until they fit, so a single image never weighs down a page.
--recompress re-checks existing copies and rebuilds those over budget.
"""
import io, pathlib, sys
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ["images/editorial", "images/photos", "images/uploads", "images/content"]
OUT = ROOT / "images/opt"
WIDTHS = (640, 1280)
BUDGET = {640: 70 * 1024, 1280: 190 * 1024}
QUALITIES = (74, 66, 58, 50)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

def encode(im, w):
    copy = im.copy()
    if copy.width > w or copy.height > w * 1.25:
        copy.thumbnail((w, int(w * 1.25)), Image.LANCZOS)  # tall photos: cap height too
    data = b""
    for q in QUALITIES:
        buf = io.BytesIO()
        copy.save(buf, "WEBP", quality=q, method=6)
        data = buf.getvalue()
        if len(data) <= BUDGET[w]:
            break
    return data

def main():
    recompress = "--recompress" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    made = 0
    for folder in SOURCES:
        base = ROOT / folder
        if not base.exists():
            continue
        for src in sorted(base.rglob("*")):
            if src.suffix.lower() not in EXTS:
                continue
            targets = {w: OUT / f"{src.stem}-{w}.webp" for w in WIDTHS}
            todo = [w for w, t in targets.items()
                    if not t.exists() or (recompress and t.stat().st_size > BUDGET[w])]
            if not todo:
                continue
            try:
                im = ImageOps.exif_transpose(Image.open(src))
            except Exception as exc:  # unsupported format, e.g. AVIF without plugin
                print(f"skip {src.relative_to(ROOT)}: {exc}", file=sys.stderr)
                continue
            im = im.convert("RGB")
            for w in todo:
                data = encode(im, w)
                if targets[w].exists() and len(data) >= targets[w].stat().st_size:
                    continue
                targets[w].write_bytes(data)
                made += 1
    print(f"optimized images written: {made}")

if __name__ == "__main__":
    main()
