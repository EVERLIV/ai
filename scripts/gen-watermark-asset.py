"""Generate white watermark lockup PNG for property photo processing."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
LOGO_PATH = os.path.join(ROOT, "src", "assets", "logo-ac-mark.svg")
OUT_PATH = os.path.join(ROOT, "src", "assets", "watermark-arendacity.png")

# Fallback: use logo-ac.png if SVG rasterization unavailable
LOGO_PNG = os.path.join(ROOT, "src", "assets", "logo-ac.png")


def load_mark(size: int) -> Image.Image:
    """Load and tint logo mark to white."""
    src = Image.open(LOGO_PNG).convert("RGBA")
    # Remove black background, keep red lines -> convert non-transparent to white
    datas = list(src.getdata())
    new = []
    for r, g, b, a in datas:
        if a < 16:
            new.append((255, 255, 255, 0))
        else:
            lum = (r + g + b) / 3
            if lum < 40:
                new.append((255, 255, 255, 0))
            else:
                new.append((255, 255, 255, min(255, int(a * 1.1))))
    src.putdata(new)
    src.thumbnail((size, size), Image.LANCZOS)
    return src


def main() -> None:
    canvas_w, canvas_h = 800, 220
    img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    mark = load_mark(120)
    img.paste(mark, (24, (canvas_h - mark.height) // 2), mark)

    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arialbd.ttf", 72)
    except OSError:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 72)
        except OSError:
            font = ImageFont.load_default()

    text = "АРЕНДАСИТИ"
    tx = 160
    ty = (canvas_h - 72) // 2 + 4
    draw.text((tx, ty), text, fill=(255, 255, 255, 255), font=font)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    img.save(OUT_PATH, "PNG")
    print("wrote", OUT_PATH, os.path.getsize(OUT_PATH))


if __name__ == "__main__":
    main()
