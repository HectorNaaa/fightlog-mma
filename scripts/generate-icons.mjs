// One-off script: rasterizes the FightLog brand mark into the PNG sizes
// needed for the web app manifest / iOS "Add to Home Screen" icon.
// Run with: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6d1e29" />
      <stop offset="100%" stop-color="#8b2635" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)" />
  <rect x="18" y="18" width="476" height="476" rx="82" fill="none" stroke="#e8e0d0" stroke-opacity="0.15" stroke-width="6" />
  <text
    x="50%"
    y="54%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, 'Helvetica Neue', sans-serif"
    font-weight="900"
    font-size="248"
    letter-spacing="-6"
    fill="#f0ebe0"
  >FL</text>
</svg>
`;

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const svgBuffer = Buffer.from(svg);

  for (const { file, size } of targets) {
    const outPath = path.join(outDir, file);
    await sharp(svgBuffer, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
