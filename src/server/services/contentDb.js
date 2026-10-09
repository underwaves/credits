import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

function getDataDir() {
  return process.env.DATA_DIR || path.join(rootDir, 'src', 'server', 'data');
}

function getContentFilePath() {
  return path.join(getDataDir(), 'content.json');
}

export const DEFAULT_CONTENT = {
  general: {
    shopName: 'SUNFZENITH',
    tagline: 'Small Dream, Big Zenith',
    announcement: '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอทำเว็บไซต์ Web App สไลด์ และงานออกแบบสื่อ • LINE OA: @419ajynp',
    showAnnouncement: false,
    shopStatus: '🟢 เปิดรับออเดอร์ 24 ชม.',
    heroTitleLead: 'เปลี่ยน',
    heroTitleHighlight1: 'ไอเดียเล็ก ๆ',
    heroTitleMid: 'ให้กลายเป็นผลงานที่',
    heroTitleHighlight2: 'ไปได้ไกลกว่าที่คิด ✨',
    heroDesc: 'ยินดีต้อนรับสู่ SUNFZENITH ร้านเล็ก ๆ ที่ตั้งใจทำงานคุณภาพ รับทำเว็บไซต์เริ่มต้น 149.- สไลด์และโปสเตอร์เริ่มต้นเพียง 49.- ในราคานักศึกษาและร้านค้าเล็ก ๆ ที่เข้าถึงง่าย ใส่ใจรายละเอียดในทุกชิ้นงาน ออกแบบให้เหมาะกับการใช้งานจริง พร้อมตรวจสอบและทดสอบงานก่อนส่งมอบ',
    trustBadge1Title: 'ปรึกษา & ประเมินฟรี 100%',
    trustBadge1Sub: 'ส่งโจทย์หรือไอเดียคร่าว ๆ มาคุยก่อนได้',
    trustBadge2Title: 'สไลด์ & โปสเตอร์ เริ่มต้น 49 ฿',
    trustBadge2Sub: 'เว็บ Contact 149.- • หน้าร้าน 299.-',
    mascotMotto: '“เล็กแต่ตั้งใจ ทำด้วยหัวใจทุกชิ้น”',
    ratingScore: '5.0 / 5.0 Rating',
    ratingSub: 'รีวิวแท้จากลูกค้าจริง'
  },
  socials: {
    line: {
      url: 'https://line.me/R/ti/p/@419ajynp',
      label: 'LINE OA: @419ajynp',
      enabled: true
    },
    facebook: {
      url: 'https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH',
      label: 'SUNFZENITH Official',
      enabled: true
    },
    discord: {
      url: '',
      label: 'Discord Server',
      enabled: false
    },
    tiktok: {
      url: '',
      label: 'TikTok Studio',
      enabled: false
    },
    instagram: {
      url: '',
      label: 'Instagram',
      enabled: false
    }
  },
  services: [
    {
      id: 'website',
      icon: '🌐',
      title: 'รับทำเว็บไซต์ (Website)',
      badge: 'เริ่มต้น 149 ฿ • Responsive',
      startingPrice: 'เริ่มต้น 149 ฿',
      desc: 'รับทำเว็บไซต์ทั่วไป Landing Page แนะนำตัว ร้านค้า และ Portfolio สำหรับนักศึกษาและร้านค้าเล็ก ๆ โหลดไว รองรับมือถือและคอมพิวเตอร์',
      features: [
        '🌐 เว็บ Contact / Landing Page — เริ่มต้น 149.-',
        '💳 เว็บเก็บเครดิต / Portfolio — เริ่มต้น 199.-',
        '🏪 เว็บหน้าร้าน สินค้า & บริการ — เริ่มต้น 299.-',
        '📱 ปรับแต่งเลย์เอาต์สวยงาม รองรับทุกอุปกรณ์'
      ]
    },
    {
      id: 'webapp',
      icon: '⚙️',
      title: 'Web App & ระบบหลังบ้าน',
      badge: 'ประเมินตามขอบเขตงาน',
      startingPrice: 'ประเมินตามขอบเขตงาน',
      desc: 'พัฒนา Web Application ระบบหลังบ้าน Admin จัดการข้อมูล และฟังก์ชันเฉพาะตาม Requirement และขอบเขตงานที่ต้องการ',
      features: [
        '📊 ระบบหลังบ้าน (Admin) จัดการข้อมูล',
        '📝 ฟอร์มรับข้อมูล & เชื่อมต่อฐานข้อมูลพร้อมใช้',
        '🔧 ฟีเจอร์เฉพาะตาม Requirement และขอบเขตงาน',
        '💬 ส่งรายละเอียดมาประเมินราคาก่อนเริ่มงานได้ฟรี'
      ]
    },
    {
      id: 'slide',
      icon: '📑',
      title: 'รับทำสไลด์งาน (Slide Deck)',
      badge: 'เริ่มต้น 49 ฿ • สวยงามอ่านง่าย',
      startingPrice: 'เริ่มต้น 49 ฿',
      desc: 'งานออกแบบสไลด์พรีเซนต์ รายงาน และนำเสนอผลงาน ออกแบบให้เหมาะกับเนื้อหาและการใช้งาน จัดวางเลย์เอาต์สวยงามอ่านง่าย',
      features: [
        '1–5 หน้า — เริ่มต้น 49.-',
        '6–10 หน้า — เริ่มต้น 89.-',
        '11–15 หน้า — เริ่มต้น 129.-',
        '16–20 หน้า (169.-) / 21–30 หน้า (229.-) / 30+ หน้า (ประเมินตามขอบเขตงาน)'
      ]
    },
    {
      id: 'design',
      icon: '🖼️',
      title: 'โปสเตอร์ & อินโฟกราฟิก',
      badge: 'เริ่มต้น 49 ฿ • คมชัดพร้อมใช้',
      startingPrice: 'เริ่มต้น 49 ฿',
      desc: 'ออกแบบโปสเตอร์วิชาการ โครงงาน ม.ปลาย โปสเตอร์ประชาสัมพันธ์ แบนเนอร์สินค้า อินโฟกราฟิก และงานออกแบบสื่อทั่วไป',
      features: [
        'ขนาด A4 — เริ่มต้น 49.-',
        'ขนาด A3 — เริ่มต้น 69.-',
        'โปสเตอร์ประชาสัมพันธ์ — เริ่มต้น 79.-',
        'โปสเตอร์โปรโมตสินค้า / งานออกแบบสื่อทั่วไป — เริ่มต้น 99.-'
      ]
    }
  ],
  pricing: [
    {
      id: 'prc-slide',
      badge: '📑 สไลด์งาน • เรท 1-30+ หน้า',
      title: 'สไลด์พรีเซนต์ & รายงาน',
      price: 'เริ่มต้น 49 ฿',
      desc: 'สไลด์นำเสนอส่งครู/อาจารย์ งานกลุ่ม สรุปเนื้อหาบทเรียน Pitch Deck ออกแบบให้เหมาะกับเนื้อหาและการใช้งาน จัดวางสวยงามอ่านง่าย',
      isHighlight: false,
      features: [
        '1–5 หน้า (49.-) / 6–10 หน้า (89.-)',
        '11–15 หน้า (129.-) / 16–20 หน้า (169.-)',
        '21–30 หน้า (229.-) / 30+ หน้า (ประเมินตามขอบเขตงาน)',
        'จัดทำด้วย PowerPoint หรือ Canva',
        'แก้ไขตามบรีฟได้ 1–2 รอบ'
      ],
      actionText: 'สั่งทำสไลด์ / สอบถาม',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-poster',
      badge: '🖼️ โปสเตอร์ • A4 / A3 / โปรโมต',
      title: 'โปสเตอร์ & อินโฟกราฟิก',
      price: 'เริ่มต้น 49 ฿',
      desc: 'โปสเตอร์วิชาการ โครงงาน ม.ปลาย โปสเตอร์ประชาสัมพันธ์ แบนเนอร์โปรโมตสินค้า และงานออกแบบสื่อทั่วไป ไฟล์คมชัดพร้อมพิมพ์',
      isHighlight: false,
      features: [
        'ขนาด A4 (49.-) / ขนาด A3 (69.-)',
        'โปสเตอร์ประชาสัมพันธ์ (79.-)',
        'โปสเตอร์โปรโมตสินค้า / งานทั่วไป (99.-)',
        'ไฟล์ความละเอียดสูง Print Ready คมชัด',
        'แก้ไขตามบรีฟได้ 1–2 รอบ'
      ],
      actionText: 'สั่งทำโปสเตอร์ / สอบถาม',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-landing',
      badge: '⭐ ยอดนิยม • เว็บเริ่มต้น',
      title: 'เว็บ Contact / Landing Page',
      price: 'เริ่มต้น 149 ฿',
      desc: 'เหมาะสำหรับผู้ที่ต้องการหน้าเว็บแนะนำตัว ร้านค้า หรือรวมช่องทางติดต่อไว้ในที่เดียว โหลดไว รองรับมือถือและคอมพิวเตอร์',
      isHighlight: true,
      features: [
        'เว็บ Contact / รวมช่องทางติดต่อในที่เดียว',
        'ดีไซน์ Responsive สวยงามรองรับมือถือ',
        'เชื่อมต่อปุ่มแชท LINE OA & Social Media',
        'ตรวจสอบและทดสอบการใช้งานก่อนส่งมอบ',
        'แก้ไขตามบรีฟได้ 1–2 รอบ'
      ],
      actionText: 'ปรึกษาทำเว็บ 149.-',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-portfolio',
      badge: '💳 เก็บผลงาน & แนะนำตัว',
      title: 'เว็บเก็บเครดิต / Portfolio',
      price: 'เริ่มต้น 199 ฿',
      desc: 'เหมาะสำหรับเก็บผลงาน แนะนำตัว รวม Social Media หรือใช้เป็นหน้า Portfolio ส่วนตัว สร้างความน่าเชื่อถือ',
      isHighlight: false,
      features: [
        'หน้า Showcase โชว์ผลงาน/รูปภาพ',
        'ระบบรวมเครดิตหรือรวม Social Media',
        'โครงสร้างโหลดไว สวยงาม ทันสมัย',
        'ตรวจสอบและทดสอบการใช้งานก่อนส่งมอบ',
        'แก้ไขตามบรีฟได้ 1–2 รอบ'
      ],
      actionText: 'ปรึกษาทำเว็บ 199.-',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-store',
      badge: '🏪 ร้านค้า & ระบบ • เริ่มต้น 299.-',
      title: 'เว็บหน้าร้าน & Web App',
      price: 'เริ่มต้น 299 ฿',
      desc: 'เหมาะสำหรับร้านค้าเล็ก ๆ หรือผู้ที่ต้องการมีเว็บไซต์แนะนำสินค้าและบริการ รวมถึงระบบที่มีฟังก์ชันเพิ่มเติม (ประเมินตามขอบเขตงาน)',
      isHighlight: false,
      features: [
        'เว็บหน้าร้านแนะนำสินค้า & บริการ (เริ่มต้น 299.-)',
        'แคตตาล็อกสินค้าพร้อมรูปภาพและราคา',
        'ระบบหลังบ้าน Admin / Web App / ฟีเจอร์เพิ่มเติม (ประเมินตามขอบเขตงาน)',
        'ตรวจสอบและทดสอบการใช้งานก่อนส่งมอบ',
        'สอบถามรายละเอียดและส่งโจทย์มาประเมินฟรี'
      ],
      actionText: 'ส่งโจทย์มาประเมินฟรี',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    }
  ]
};

function ensureDataFile() {
  const dir = getDataDir();
  const file = getContentFilePath();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    const defaultSource = path.join(rootDir, 'src', 'server', 'data', 'content.json');
    let contentToSeed = DEFAULT_CONTENT;
    if (fs.existsSync(defaultSource)) {
      try {
        contentToSeed = JSON.parse(fs.readFileSync(defaultSource, 'utf8'));
      } catch {}
    }
    fs.writeFileSync(file, JSON.stringify(contentToSeed, null, 2), 'utf8');
  }
}

export function getSiteContent() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(getContentFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      general: { ...DEFAULT_CONTENT.general, ...(parsed.general || {}) },
      socials: { ...DEFAULT_CONTENT.socials, ...(parsed.socials || {}) },
      services: Array.isArray(parsed.services) ? parsed.services : DEFAULT_CONTENT.services,
      pricing: Array.isArray(parsed.pricing) ? parsed.pricing : DEFAULT_CONTENT.pricing
    };
  } catch (err) {
    console.error('[contentDb] Error reading content file:', err);
    return JSON.parse(JSON.stringify(DEFAULT_CONTENT));
  }
}

export function saveSiteContent(fullContent) {
  ensureDataFile();
  fs.writeFileSync(getContentFilePath(), JSON.stringify(fullContent, null, 2), 'utf8');
}

export function updateGeneralContent(updates) {
  const current = getSiteContent();
  current.general = {
    ...current.general,
    ...updates
  };
  saveSiteContent(current);
  return current.general;
}

export function updateSocialsContent(updates) {
  const current = getSiteContent();
  current.socials = {
    ...current.socials,
    ...updates
  };
  saveSiteContent(current);
  return current.socials;
}

// ---------------- Services CRUD ----------------
export function createService(serviceData) {
  const current = getSiteContent();
  const id = `srv-${Date.now()}`;
  const newService = {
    id,
    icon: serviceData.icon?.trim() || '✨',
    title: serviceData.title?.trim() || 'บริการใหม่',
    badge: serviceData.badge?.trim() || '',
    startingPrice: serviceData.startingPrice?.trim() || 'ราคาคุยกันได้',
    desc: serviceData.desc?.trim() || '',
    features: Array.isArray(serviceData.features)
      ? serviceData.features
      : (serviceData.features ? String(serviceData.features).split('\n').map(f => f.trim()).filter(Boolean) : [])
  };

  current.services.push(newService);
  saveSiteContent(current);
  return newService;
}

export function updateService(id, updates) {
  const current = getSiteContent();
  const index = current.services.findIndex(s => s.id === id);
  if (index === -1) return null;

  const existing = current.services[index];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    features: Array.isArray(updates.features)
      ? updates.features
      : (updates.features !== undefined ? String(updates.features).split('\n').map(f => f.trim()).filter(Boolean) : existing.features)
  };

  current.services[index] = updated;
  saveSiteContent(current);
  return updated;
}

export function deleteService(id) {
  const current = getSiteContent();
  const filtered = current.services.filter(s => s.id !== id);
  if (filtered.length === current.services.length) return false;
  current.services = filtered;
  saveSiteContent(current);
  return true;
}

// ---------------- Pricing CRUD ----------------
export function createPricing(pricingData) {
  const current = getSiteContent();
  const id = `prc-${Date.now()}`;
  const newPricing = {
    id,
    badge: pricingData.badge?.trim() || 'เรทสบายกระเป๋า',
    title: pricingData.title?.trim() || 'แพ็กเกจใหม่',
    price: pricingData.price?.trim() || 'เริ่มต้น 49 ฿',
    desc: pricingData.desc?.trim() || '',
    isHighlight: Boolean(pricingData.isHighlight),
    features: Array.isArray(pricingData.features)
      ? pricingData.features
      : (pricingData.features ? String(pricingData.features).split('\n').map(f => f.trim()).filter(Boolean) : []),
    actionText: pricingData.actionText?.trim() || 'ปรึกษาฟรี',
    actionUrl: pricingData.actionUrl?.trim() || '#contact'
  };

  current.pricing.push(newPricing);
  saveSiteContent(current);
  return newPricing;
}

export function updatePricing(id, updates) {
  const current = getSiteContent();
  const index = current.pricing.findIndex(p => p.id === id);
  if (index === -1) return null;

  const existing = current.pricing[index];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    features: Array.isArray(updates.features)
      ? updates.features
      : (updates.features !== undefined ? String(updates.features).split('\n').map(f => f.trim()).filter(Boolean) : existing.features)
  };

  current.pricing[index] = updated;
  saveSiteContent(current);
  return updated;
}

export function deletePricing(id) {
  const current = getSiteContent();
  const filtered = current.pricing.filter(p => p.id !== id);
  if (filtered.length === current.pricing.length) return false;
  current.pricing = filtered;
  saveSiteContent(current);
  return true;
}
