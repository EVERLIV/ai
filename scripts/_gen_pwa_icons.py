from pathlib import Path
from PIL import Image

src_path = Path(
    r"C:\Users\Admin\.cursor\projects\f-AC-City-ai\assets"
    r"\c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"d4faaeab402237a9fb87134fb7a0768e_images_a3-a9c9b021-0f76-4cc3-958a-c6813c5b3543.png"
)
out_dir = Path(r"f:\AC City\ai\public")
icons = out_dir / "icons"
icons.mkdir(exist_ok=True)

src = Image.open(src_path).convert("RGBA")


def fit_square(
    img: Image.Image,
    size: int,
    pad_ratio: float = 0.08,
    bg=(255, 255, 255, 255),
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    max_side = int(size * (1 - 2 * pad_ratio))
    bbox = img.getbbox()
    cropped = img.crop(bbox) if bbox else img
    w, h = cropped.size
    scale = min(max_side / w, max_side / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_rgb(img: Image.Image, path: Path) -> None:
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(path.name, path.stat().st_size)


save_rgb(fit_square(src, 192, 0.08), icons / "icon-192.png")
save_rgb(fit_square(src, 512, 0.08), icons / "icon-512.png")
save_rgb(fit_square(src, 512, 0.18), icons / "icon-512-maskable.png")
save_rgb(fit_square(src, 180, 0.08), out_dir / "apple-touch-icon.png")
save_rgb(fit_square(src, 32, 0.06), out_dir / "favicon.png")
save_rgb(fit_square(src, 192, 0.08), icons / "android.png")
save_rgb(fit_square(src, 180, 0.08), icons / "apple.png")
src.convert("RGB").save(out_dir / "icon-dadatut-pin.png", "PNG", optimize=True)
print("done")
