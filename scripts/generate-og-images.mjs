/**
 * Generates public/og-default.jpg (1200×630).
 * Иконки PWA: node scripts/generate-pwa-icons.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const RED = "#8B0015";
const DARK = "#2A2A2A";
const CREAM = "#FBFAF7";

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${CREAM}"/>
  <path fill="${DARK}" d="M156 150c-48 0-86 39-86 87 0 66 86 154 86 154s86-88 86-154c0-48-38-87-86-87z"/>
  <circle cx="156" cy="228" r="38" fill="${RED}"/>
  <text x="268" y="248" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="${DARK}">ДАДА</text>
  <text x="520" y="248" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="${RED}">ТУТ</text>
  <text x="268" y="292" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="${DARK}">НЕДВИЖИМОСТЬ</text>
  <text x="80" y="420" font-family="Arial, sans-serif" font-size="36" font-weight="600" fill="${DARK}">У вас вся недвижимость региона?</text>
  <text x="80" y="470" font-family="Arial, sans-serif" font-size="36" font-weight="600" fill="${RED}">Дада, тут!</text>
  <text x="80" y="560" font-family="Arial, sans-serif" font-size="24" fill="#676E79">dadatut.ru</text>
</svg>`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 88 })
  .toFile(join(publicDir, "og-default.jpg"));
console.log("✓ public/og-default.jpg");
