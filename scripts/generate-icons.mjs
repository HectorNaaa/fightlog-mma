// One-off script: rasterizes the FightLog brand mark (public/logo/fightlog-mark-bg.png,
// the solid-black-background version) into the PNG sizes needed for the web app
// manifest / iOS "Add to Home Screen" icon, plus a real favicon.ico.
// Run with: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const outDir = path.join(publicDir, "icons");
const sourceLogo = path.join(publicDir, "logo", "fightlog-mark-bg.png");
const faviconPath = path.join(__dirname, "..", "app", "favicon.ico");

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

// Builds a minimal single-image .ico container around a PNG buffer — supported
// by all modern browsers/OSes (no extra ico-encoding dependency needed).
function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256px)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256px)
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // size of image data
  entry.writeUInt32LE(header.length + entry.length, 12); // offset to image data

  return Buffer.concat([header, entry, pngBuffer]);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const { file, size } of targets) {
    const outPath = path.join(outDir, file);
    await sharp(sourceLogo)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(outPath);
    console.log(`wrote ${outPath}`);
  }

  const faviconSize = 48;
  const faviconPng = await sharp(sourceLogo)
    .resize(faviconSize, faviconSize, { fit: "cover" })
    .png()
    .toBuffer();
  await writeFile(faviconPath, pngToIco(faviconPng, faviconSize));
  console.log(`wrote ${faviconPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

