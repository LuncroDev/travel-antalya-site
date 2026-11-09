#!/usr/bin/env python3
"""Create fast-loading WebP copies of site photos.

Usage: python3 scripts/optimize-images.py
Writes images/opt/<name>-640.webp and <name>-1280.webp for every photo in the
source folders. Existing outputs are skipped, so it is safe to run after adding
new photos (the daily content workflow runs it before committing).
"""
import pathlib, sys
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ["images/editorial", "images/photos", "images/uploads", "images/content"]
OUT = ROOT / "images/opt"
WIDTHS = (640, 1280)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    made = 0
    for folder in SOURCES:
        base = ROOT / folder
        if not base.exists():
            continue
        for src in sorted(base.rglob("*")):
            if src.suffix.lower() not in EXTS:
                continue
            targets = [OUT / f"{src.stem}-{w}.webp" for w in WIDTHS]
            if all(t.exists() for t in targets):
                continue
            try:
                im = ImageOps.exif_transpose(Image.open(src))
            except Exception as exc:  # unsupported format, e.g. AVIF without plugin
                print(f"skip {src.relative_to(ROOT)}: {exc}", file=sys.stderr)
                continue
            im = im.convert("RGB")
            for w, target in zip(WIDTHS, targets):
                if target.exists():
                    continue
                copy = im.copy()
                if copy.width > w:
                    copy.thumbnail((w, w * 4), Image.LANCZOS)
                copy.save(target, "WEBP", quality=74, method=6)
                made += 1
    print(f"optimized images written: {made}")

if __name__ == "__main__":
    main()
