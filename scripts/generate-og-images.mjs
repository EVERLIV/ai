/**
 * Generates public/og-default.jpg (1200×630) and public/apple-touch-icon.png (180×180).
 * Run once after clone or when branding changes: node scripts/generate-og-images.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const faviconPath = join(publicDir, "favicon.png");

const BRAND = "#2563eb";
const DARK = "#0f172a";

async function createAppleTouchIcon() {
  await sharp(faviconPath)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("✓ public/apple-touch-icon.png");
}

async function createOgDefault() {
  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${DARK}"/>
      <stop offset="100%" style="stop-color:#1e3a5f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="80" width="72" height="72" rx="8" fill="${BRAND}"/>
  <text x="116" y="128" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="white" text-anchor="middle">А</text>
  <text x="172" y="128" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="white">АРЕНДА</text>
  <text x="172" y="128" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="${BRAND}" dx="168">СИТИ</text>
  <text x="80" y="220" font-family="Arial, sans-serif" font-size="48" font-weight="600" fill="white">Коммерческая недвижимость</text>
  <text x="80" y="280" font-family="Arial, sans-serif" font-size="48" font-weight="600" fill="white">в Иркутске</text>
  <text x="80" y="360" font-family="Arial, sans-serif" font-size="28" fill="#94a3b8">Офисы · Торговые площади · Склады</text>
  <text x="80" y="540" font-family="Arial, sans-serif" font-size="24" fill="#64748b">arendacity.com</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 88 })
    .toFile(join(publicDir, "og-default.jpg"));
  console.log("✓ public/og-default.jpg");
}

try {
  readFileSync(faviconPath);
} catch {
  console.error("Missing public/favicon.png — add favicon first.");
  process.exit(1);
}

await createAppleTouchIcon();
await createOgDefault();
