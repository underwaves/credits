import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function main() {
  console.log('Generating official SUNFZENITH Mascot assets...');
  
  const rawPath = path.join(root, 'public', 'images', 'mascot-raw.png');
  const raw = await sharp(rawPath).raw().toBuffer({ resolveWithObject: true });
  const w = raw.info.width;
  const h = raw.info.height;
  const data = raw.data;

  // 1. Precise background removal with BFS flood-fill and de-fringing
  const bgMask = new Float32Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed borders
  for (let x = 0; x < w; x++) {
    queue.push(x, (h - 1) * w + x);
    visited[x] = 1; visited[(h - 1) * w + x] = 1;
  }
  for (let y = 1; y < h - 1; y++) {
    queue.push(y * w, y * w + (w - 1));
    visited[y * w] = 1; visited[y * w + (w - 1)] = 1;
  }

  // Seed inner pocket between chin and left braid (x=304, y=705)
  const pocketPos = 705 * w + 304;
  queue.push(pocketPos);
  visited[pocketPos] = 1;

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const idx = curr * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const minVal = Math.min(r, g, b);
    
    if (minVal >= 250) {
      bgMask[curr] = 1.0;
    } else if (minVal >= 238) {
      bgMask[curr] = (minVal - 238) / (250 - 238);
    } else {
      bgMask[curr] = 0.0;
    }

    if (minVal >= 242) {
      const cx = curr % w;
      const cy = Math.floor(curr / w);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx;
          if (!visited[npos]) {
            visited[npos] = 1;
            queue.push(npos);
          }
        }
      }
    }
  }

  // Defringed RGBA Buffer
  const cleanBuf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const bg = bgMask[i];
    const a = 1.0 - bg;
    
    if (a <= 0.001) {
      cleanBuf[idx] = 0;
      cleanBuf[idx + 1] = 0;
      cleanBuf[idx + 2] = 0;
      cleanBuf[idx + 3] = 0;
    } else if (a >= 0.999) {
      cleanBuf[idx] = data[idx];
      cleanBuf[idx + 1] = data[idx + 1];
      cleanBuf[idx + 2] = data[idx + 2];
      cleanBuf[idx + 3] = 255;
    } else {
      const r = Math.max(0, Math.min(255, Math.round((data[idx] - (1 - a) * 254) / a)));
      const g = Math.max(0, Math.min(255, Math.round((data[idx + 1] - (1 - a) * 254) / a)));
      const b = Math.max(0, Math.min(255, Math.round((data[idx + 2] - (1 - a) * 254) / a)));
      cleanBuf[idx] = r;
      cleanBuf[idx + 1] = g;
      cleanBuf[idx + 2] = b;
      cleanBuf[idx + 3] = Math.round(a * 255);
    }
  }

  const fullTransparent = sharp(cleanBuf, { raw: { width: w, height: h, channels: 4 } });
  const fullPngBuffer = await fullTransparent.png().toBuffer();

  // 2. Full Mascot (1024x1024)
  // Character bounding box is minX: 120, maxX: 946, minY: 110, maxY: 963
  // Center is x: 533, y: 536
  // Cropped square 874x874 around (533, 536):
  const squareCrop = await sharp(fullPngBuffer)
    .extract({ left: 96, top: 100, width: 874, height: 874 })
    .toBuffer();

  // Resize full mascot to 512x512
  const mascotFull512 = await sharp(squareCrop).resize(512, 512).png().toBuffer();
  
  // 3. Navbar, Footer, & Brand Logo:
  // Character bounding box is minX: 120, maxX: 946, minY: 110, maxY: 963
  // Optimal head-and-face framing with hair accessories and braids:
  const logoCrop = await sharp(fullPngBuffer)
    .extract({ left: 140, top: 110, width: 780, height: 780 })
    .toBuffer();

  const mascot512 = await sharp(logoCrop).resize(512, 512).png().toBuffer();
  const mascotLogo = await sharp(logoCrop).resize(256, 256).png().toBuffer();

  // 4. Favicon Face Crop (optimized for readability at 16x16 and 32x32):
  const favicon512 = await sharp(logoCrop).resize(512, 512).png().toBuffer();
  const favicon180 = await sharp(logoCrop).resize(180, 180).png().toBuffer(); // apple-touch-icon
  const favicon128 = await sharp(logoCrop).resize(128, 128).png().toBuffer();
  const favicon64 = await sharp(logoCrop).resize(64, 64).png().toBuffer();
  const favicon32 = await sharp(logoCrop).resize(32, 32).png().toBuffer();
  const favicon16 = await sharp(logoCrop).resize(16, 16).png().toBuffer();

  // 5. Generate mascot logo.svg with embedded crisp data URI
  const base64Mascot = mascotLogo.toString('base64');
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Mascot}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

  // 6. Save all assets to `public/`, `web/public/`, and `dist/`
  const dirSets = [
    path.join(root, 'public'),
    path.join(root, 'web', 'public'),
    path.join(root, 'dist')
  ];

  for (const dir of dirSets) {
    const imgDir = path.join(dir, 'images');
    fs.mkdirSync(imgDir, { recursive: true });

    // Mascot files
    fs.writeFileSync(path.join(imgDir, 'mascot.png'), fullPngBuffer);
    fs.writeFileSync(path.join(imgDir, 'brand-mascot.png'), mascot512);
    fs.writeFileSync(path.join(imgDir, 'mascot-logo.png'), mascotLogo);
    fs.writeFileSync(path.join(imgDir, 'logo.svg'), logoSvg);

    // Favicons
    fs.writeFileSync(path.join(imgDir, 'favicon.png'), favicon128);
    fs.writeFileSync(path.join(imgDir, 'favicon-32x32.png'), favicon32);
    fs.writeFileSync(path.join(imgDir, 'favicon-16x16.png'), favicon16);
    fs.writeFileSync(path.join(imgDir, 'apple-touch-icon.png'), favicon180);

    // Root favicons
    fs.writeFileSync(path.join(dir, 'favicon.ico'), favicon32);
    fs.writeFileSync(path.join(dir, 'favicon.png'), favicon128);
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), favicon180);
  }

  console.log('✓ All brand mascot assets and favicons generated and saved successfully!');
}

main().catch(console.error);
