"""Generate white watermark PNG for property photo processing (DADATYT logo)."""
from __future__ import annotations

import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
LOGO_PATH = os.path.join(ROOT, "src", "assets", "logo-dadatut.png")
OUT_PATH = os.path.join(ROOT, "src", "assets", "watermark-dadatut.png")


def to_white_watermark(src: Image.Image) -> Image.Image:
    """Convert colored logo to white on transparent (keep alpha)."""
    rgba = src.convert("RGBA")
    datas = list(rgba.getdata())
    new = []
    for r, g, b, a in datas:
        if a < 16:
            new.append((255, 255, 255, 0))
        else:
            new.append((255, 255, 255, min(255, int(a * 0.95))))
    rgba.putdata(new)
    return rgba


def main() -> None:
    if not os.path.isfile(LOGO_PATH):
        raise SystemExit(f"Missing logo: {LOGO_PATH}")

    src = Image.open(LOGO_PATH)
    wm = to_white_watermark(src)
    bbox = wm.getbbox()
    if bbox:
        wm = wm.crop(bbox)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    wm.save(OUT_PATH, "PNG")
    print("wrote", OUT_PATH, wm.size, os.path.getsize(OUT_PATH))


if __name__ == "__main__":
    main()
