/**
 * Иконки PWA / favicon / apple-touch из src/assets/logo-dadatut-pin.png
 * node scripts/generate-pwa-icons.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src", "assets", "logo-dadatut-pin.png");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

async function iconBuffer(size, pad = 0.12) {
  const inner = Math.max(1, Math.round(size * (1 - pad * 2)));
  const pin = await sharp(src)
    .flatten({ background: BLACK })
    .resize(inner, inner, {
      fit: "contain",
      background: BLACK,
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: BLACK },
  })
    .composite([{ input: pin, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeIcon(size, dest, pad) {
  await sharp(await iconBuffer(size, pad)).toFile(dest);
  const rel = dest.slice(root.length + 1);
  console.log("✓", rel);
}

mkdirSync(iconsDir, { recursive: true });

await writeIcon(192, join(iconsDir, "icon-192.png"), 0.1);
await writeIcon(512, join(iconsDir, "icon-512.png"), 0.1);
await writeIcon(512, join(iconsDir, "icon-512-maskable.png"), 0.2);
await writeIcon(180, join(publicDir, "apple-touch-icon.png"), 0.1);
await writeIcon(64, join(publicDir, "favicon.png"), 0.08);

console.log("PWA icons from logo-dadatut-pin.png");
