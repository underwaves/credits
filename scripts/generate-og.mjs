import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const svgBanner = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8F4FD"/>
      <stop offset="45%" stop-color="#FFFDF7"/>
      <stop offset="100%" stop-color="#FFF5D6"/>
    </linearGradient>

    <!-- Sun Disc Gradient -->
    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE873"/>
      <stop offset="50%" stop-color="#FFD43F"/>
      <stop offset="100%" stop-color="#FFAE1A"/>
    </linearGradient>

    <!-- Sun Halo Gradient -->
    <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="#FFDD55" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FFDD55" stop-opacity="0"/>
    </radialGradient>

    <!-- Soft Cloud Gradient -->
    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F0F7FF"/>
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#16203D" flood-opacity="0.08"/>
    </filter>
    <filter id="sunShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#E59900" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative Background Clouds & Rings -->
  <circle cx="280" cy="315" r="230" fill="url(#sunHalo)"/>
  
  <!-- Subtle background dots/stars -->
  <circle cx="120" cy="100" r="4" fill="#FFC93E" opacity="0.8"/>
  <circle cx="220" cy="70" r="6" fill="#70B8F8" opacity="0.6"/>
  <circle cx="1060" cy="120" r="5" fill="#FFB72B" opacity="0.7"/>
  <circle cx="1120" cy="220" r="7" fill="#70B8F8" opacity="0.5"/>
  <circle cx="560" cy="90" r="5" fill="#FFAA00" opacity="0.6"/>
  <circle cx="680" cy="560" r="5" fill="#FFC93E" opacity="0.8"/>

  <!-- Left: The Big Smiling Sun Mascot -->
  <g transform="translate(280, 315)">
    <!-- Sun Rays (12 Petal Rays) -->
    <g filter="url(#sunShadow)">
      <!-- 0 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A"/>
      <!-- 30 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(30)"/>
      <!-- 60 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(60)"/>
      <!-- 90 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(90)"/>
      <!-- 120 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(120)"/>
      <!-- 150 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(150)"/>
      <!-- 180 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(180)"/>
      <!-- 210 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(210)"/>
      <!-- 240 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(240)"/>
      <!-- 270 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(270)"/>
      <!-- 300 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(300)"/>
      <!-- 330 deg -->
      <path d="M-22,-168 Q0,-190 22,-168 L15,-130 L-15,-130 Z" fill="#FFCA3A" transform="rotate(330)"/>
    </g>

    <!-- Main Sun Face Circle -->
    <circle cx="0" cy="0" r="135" fill="url(#sunGrad)" filter="url(#sunShadow)"/>
    <circle cx="0" cy="0" r="131" fill="none" stroke="#FFFFFF" stroke-width="6" opacity="0.6"/>

    <!-- Happy Face Features -->
    <!-- Eyes -->
    <ellipse cx="-44" cy="-15" rx="12" ry="16" fill="#1C274C"/>
    <circle cx="-48" cy="-21" r="5" fill="#FFFFFF"/>
    <circle cx="-40" cy="-9" r="2.5" fill="#FFFFFF"/>

    <ellipse cx="44" cy="-15" rx="12" ry="16" fill="#1C274C"/>
    <circle cx="40" cy="-21" r="5" fill="#FFFFFF"/>
    <circle cx="48" cy="-9" r="2.5" fill="#FFFFFF"/>

    <!-- Rosy Cheeks -->
    <ellipse cx="-64" cy="18" rx="18" ry="11" fill="#FF708F" opacity="0.65"/>
    <ellipse cx="64" cy="18" rx="18" ry="11" fill="#FF708F" opacity="0.65"/>

    <!-- Cute Big Smile -->
    <path d="M-30,15 Q0,48 30,15" fill="#FF5376" stroke="#1C274C" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M-18,24 Q0,38 18,24" fill="#FFFFFF" opacity="0.85"/>
  </g>

  <!-- Soft Fluffy Cloud Under The Sun -->
  <g transform="translate(180, 430)" filter="url(#cardShadow)">
    <path d="M40,50 
             Q20,50 10,35 Q0,20 15,5 Q30,-10 50,0 Q65,-25 95,-20 Q125,-15 135,10 Q155,5 170,20 Q185,35 170,50 Z" 
          fill="url(#cloudGrad)"/>
  </g>

  <!-- Right: Typography & Brand Information Card -->
  <g transform="translate(540, 110)">
    <!-- Top Pill Badge -->
    <g transform="translate(0, 0)">
      <rect width="260" height="42" rx="21" fill="#FFF2BD" stroke="#FDE047" stroke-width="2"/>
      <text x="22" y="27" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#B45309">
        ☀️ DIGITAL &amp; TECH STUDIO
      </text>
    </g>

    <!-- Main Title -->
    <text x="0" y="115" font-family="'Segoe UI', -apple-system, sans-serif" font-size="64" font-weight="900" fill="#16203D" letter-spacing="-1">
      SUNFZENITH
    </text>

    <!-- Subtitle / Concept -->
    <text x="0" y="165" font-family="'Segoe UI', -apple-system, sans-serif" font-size="28" font-weight="700" fill="#2563EB">
      “Small Dream, Big Zenith”
    </text>

    <!-- Description -->
    <text x="0" y="215" font-family="'Segoe UI', -apple-system, sans-serif" font-size="20" font-weight="500" fill="#4B5563">
      บริการทำเว็บไซต์ • ช่วยเขียนโค้ด • สไลด์พรีเซนต์ • โปสเตอร์
    </text>

    <!-- Highlights Badges Row -->
    <g transform="translate(0, 260)">
      <!-- Badge 1: Free Consultation -->
      <g transform="translate(0, 0)">
        <rect width="210" height="46" rx="23" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="1.5"/>
        <text x="24" y="29" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#0369A1">
          💬 ปรึกษาฟรี 100%
        </text>
      </g>

      <!-- Badge 2: Slides & Poster Starting 49.- -->
      <g transform="translate(225, 0)">
        <rect width="245" height="46" rx="23" fill="#FEF3C7" stroke="#FDE68A" stroke-width="1.5"/>
        <text x="20" y="29" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#92400E">
          🎨 สไลด์/โปสเตอร์ เริ่มต้น 49 ฿
        </text>
      </g>
    </g>

    <!-- Bottom URL Link Pill -->
    <g transform="translate(0, 340)">
      <text x="0" y="24" font-family="'Segoe UI', -apple-system, sans-serif" font-size="18" font-weight="600" fill="#6B7280">
        🌐 sunfz-credits.onrender.com
      </text>
    </g>
  </g>
</svg>
`;

async function main() {
  const buf = Buffer.from(svgBanner);
  const outPath1 = path.join(root, 'web', 'public', 'images', 'og-sun.png');
  const outPath2 = path.join(root, 'public', 'images', 'og-sun.png');

  // Ensure directories exist
  fs.mkdirSync(path.dirname(outPath1), { recursive: true });
  fs.mkdirSync(path.dirname(outPath2), { recursive: true });

  await sharp(buf)
    .resize(1200, 630)
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(outPath1);

  await sharp(buf)
    .resize(1200, 630)
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(outPath2);

  console.log('✅ Generated 1200x630 OG image at:', outPath1);
}

main().catch(console.error);
