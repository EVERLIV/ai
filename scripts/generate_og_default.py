"""Generate public/og-default.jpg — OG preview for messengers (ДАДАТУТ)."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
W, H = 1200, 630
BG = (250, 248, 245)
FG = (26, 32, 40)
MUTED = (110, 118, 128)
RED = (139, 0, 21)  # #8B0015
CARD = (255, 255, 255)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        [
            r"C:\Windows\Fonts\arialbd.ttf",
            r"C:\Windows\Fonts\segoeuib.ttf",
        ]
        if bold
        else [
            r"C:\Windows\Fonts\arial.ttf",
            r"C:\Windows\Fonts\segoeui.ttf",
        ]
    )
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    out = Image.new("RGB", (W, H), BG)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((720, -180, 1280, 380), fill=(139, 0, 21, 18))
    od.ellipse((-120, 380, 420, 780), fill=(139, 0, 21, 12))
    out = Image.alpha_composite(out.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(out)

    margin = 48
    draw.rounded_rectangle(
        (margin, margin, W - margin, H - margin),
        radius=28,
        fill=CARD,
        outline=(232, 226, 218),
        width=2,
    )

    pin = Image.open(ROOT / "public/icon-dadatut-pin.png").convert("RGBA")
    pin = pin.resize((168, 168), Image.Resampling.LANCZOS)
    px = pin.load()
    assert px is not None
    for y in range(pin.height):
        for x in range(pin.width):
            r, g, b, a = px[x, y]
            if r > 245 and g > 245 and b > 245:
                px[x, y] = (r, g, b, 0)

    out_rgba = out.convert("RGBA")
    out_rgba.paste(pin, (100, 180), pin)
    out = out_rgba.convert("RGB")
    draw = ImageDraw.Draw(out)

    f_brand = load_font(72, bold=True)
    f_sub = load_font(32)
    f_url = load_font(26)
    f_tag = load_font(22)

    x0, y0 = 300, 200
    draw.text((x0, y0), "ДАДА", font=f_brand, fill=FG)
    bbox = draw.textbbox((x0, y0), "ДАДА", font=f_brand)
    draw.text((bbox[2] + 18, y0), "ТУТ!", font=f_brand, fill=RED)

    draw.text((x0, y0 + 95), "Вся недвижимость региона", font=f_sub, fill=FG)
    draw.text(
        (x0, y0 + 145),
        "Жилая и коммерческая · Иркутск и область",
        font=f_tag,
        fill=MUTED,
    )
    draw.text((100, H - 110), "dadatut.ru", font=f_url, fill=MUTED)

    dest = ROOT / "public/og-default.jpg"
    out.save(dest, "JPEG", quality=92, optimize=True)
    print(f"saved {dest} {out.size} {dest.stat().st_size} bytes")


if __name__ == "__main__":
    main()
