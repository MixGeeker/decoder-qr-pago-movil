import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve } from "path";

const publicDir = resolve(import.meta.dir, "..", "public");
const svg = readFileSync(resolve(publicDir, "favicon.svg"));

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, `pwa-${size}x${size}.png`));
  console.log(`Generated pwa-${size}x${size}.png`);
}

console.log("Done!");
