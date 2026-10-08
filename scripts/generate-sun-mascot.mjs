import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE875" />
      <stop offset="65%" stop-color="#FFB800" />
      <stop offset="100%" stop-color="#F59E0B" />
    </radialGradient>
    <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFBEB" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#FEF3C7" stop-opacity="0" />
    </radialGradient>
    <filter id="rayShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#D97706" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Ambient Outer Glow -->
  <circle cx="512" cy="512" r="490" fill="url(#outerGlow)" />

  <!-- 12 Radiating Sun Rays -->
  <g filter="url(#rayShadow)">
    <path d="M512 80 L560 250 L464 250 Z" fill="#F59E0B" />
    <path d="M512 944 L560 774 L464 774 Z" fill="#F59E0B" />
    <path d="M80 512 L250 560 L250 464 Z" fill="#F59E0B" />
    <path d="M944 512 L774 560 L774 464 Z" fill="#F59E0B" />

    <path d="M206 206 L360 280 L280 360 Z" fill="#FBBF24" />
    <path d="M818 206 L744 360 L664 280 Z" fill="#FBBF24" />
    <path d="M206 818 L280 664 L360 744 Z" fill="#FBBF24" />
    <path d="M818 818 L664 744 L744 664 Z" fill="#FBBF24" />

    <!-- Accent Diamond Rays -->
    <path d="M512 30 L535 150 L512 190 L489 150 Z" fill="#FBBF24" />
    <path d="M512 994 L535 874 L512 834 L489 874 Z" fill="#FBBF24" />
    <path d="M30 512 L150 535 L190 512 L150 489 Z" fill="#FBBF24" />
    <path d="M994 512 L874 535 L834 512 L874 489 Z" fill="#FBBF24" />
  </g>

  <!-- Sun Main Core -->
  <circle cx="512" cy="512" r="290" fill="url(#coreGlow)" filter="url(#rayShadow)" stroke="#FFFBEB" stroke-width="16" />

  <!-- Cute Warm Cheeks -->
  <ellipse cx="380" cy="570" rx="46" ry="26" fill="#F87171" opacity="0.6" />
  <ellipse cx="644" cy="570" rx="46" ry="26" fill="#F87171" opacity="0.6" />

  <!-- Happy Smiling Eyes -->
  <path d="M365 480 Q400 440 435 480" stroke="#78350F" stroke-width="20" stroke-linecap="round" fill="none" />
  <path d="M589 480 Q624 440 659 480" stroke="#78350F" stroke-width="20" stroke-linecap="round" fill="none" />

  <!-- Cheerful Smile -->
  <path d="M450 540 Q512 620 574 540" stroke="#78350F" stroke-width="20" stroke-linecap="round" fill="none" />

  <!-- Warm Sparkles -->
  <circle cx="340" cy="350" r="14" fill="#FFFFFF" opacity="0.9" />
  <circle cx="680" cy="350" r="20" fill="#FFFFFF" opacity="0.95" />
</svg>
`;

async function main() {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();

  const targets = [
    path.join(root, 'web', 'public', 'images', 'mascot.png'),
    path.join(root, 'public', 'images', 'mascot.png'),
    path.join(root, 'dist', 'images', 'mascot.png'),
    path.join(root, 'web', 'public', 'images', 'brand-mascot.png'),
    path.join(root, 'public', 'images', 'brand-mascot.png')
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
    console.log('Saved:', target);
  }

  console.log('All sun mascots updated successfully!');
}

main().catch(console.error);
