import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const dataDir = path.join(rootDir, 'src', 'server', 'data');
const contentFilePath = path.join(dataDir, 'content.json');

export const DEFAULT_CONTENT = {
  general: {
    shopName: 'SUNFZENITH',
    tagline: 'Small Dream, Big Zenith',
    announcement: '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอทำเว็บ สไลด์ และดีไซน์ โดย นศ.วิศวกรรม AI • LINE OA: @419ajynp',
    showAnnouncement: false,
    shopStatus: '🟢 เปิดรับออเดอร์ 24 ชม.',
    heroTitleLead: 'เปลี่ยน',
    heroTitleHighlight1: 'ไอเดียเล็ก ๆ',
    heroTitleMid: 'ให้กลายเป็นผลงานที่',
    heroTitleHighlight2: 'ไปได้ไกลกว่าที่คิด ✨',
    heroDesc: 'ยินดีต้อนรับสู่ SUNFZENITH ดำเนินงานโดยนักศึกษาวิศวกรรม AI รับทำเว็บไซต์เริ่มต้น 149.- สไลด์และโปสเตอร์เริ่มต้นเพียง 49.- ในราคานักศึกษาที่เข้าถึงง่าย ทำมือในการออกแบบทุกงาน ไม่ใช้ AI สร้างชิ้นงาน ตรวจสอบโค้ดและทดสอบก่อนส่งมอบ',
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
      id: 'srv-web',
      icon: '💻',
      title: 'รับทำเว็บไซต์ (Web Development)',
      badge: 'เริ่มต้น 149 ฿ • Responsive',
      startingPrice: 'เริ่มต้น 149 ฿',
      desc: 'รับพัฒนาเว็บไซต์ขนาดเล็กถึงกลางตามความต้องการของลูกค้า ตรวจสอบโค้ด ปรับแก้ และทดสอบการใช้งานจริงก่อนส่งมอบ',
      features: [
        '🌐 เว็บ Contact / Landing Page — เริ่มต้น 149.-',
        '💳 เว็บเก็บเครดิต / Portfolio — เริ่มต้น 199.-',
        '🏪 เว็บหน้าร้าน สินค้า & บริการ — เริ่มต้น 299.-',
        '⚙️ เว็บไซต์ที่มีฟังก์ชันเพิ่มเติม — ประเมินตามรายละเอียด'
      ]
    },
    {
      id: 'srv-slide',
      icon: '📑',
      title: 'รับทำสไลด์งาน (Slide Deck)',
      badge: 'เริ่มต้น 49 ฿ • ทำมือไม่ใช้ AI',
      startingPrice: 'เริ่มต้น 49 ฿',
      desc: 'งานออกแบบตั้งใจทำให้เหมาะกับเนื้อหาและการใช้งานของแต่ละงาน ทำมือในการออกแบบทุกงาน ไม่ใช้ AI สร้างชิ้นงาน',
      features: [
        '1–5 หน้า — เริ่มต้น 49.-',
        '6–10 หน้า — เริ่มต้น 89.-',
        '11–15 หน้า — เริ่มต้น 129.-',
        '16–20 หน้า (169.-) / 21–30 หน้า (229.-) / 30+ หน้า (ประเมิน)'
      ]
    },
    {
      id: 'srv-poster',
      icon: '🖼️',
      title: 'รับทำโปสเตอร์ & อินโฟกราฟิก',
      badge: 'เริ่มต้น 49 ฿ • Print Ready',
      startingPrice: 'เริ่มต้น 49 ฿',
      desc: 'ออกแบบโปสเตอร์วิชาการ โครงงาน ม.ปลาย โปสเตอร์ประชาสัมพันธ์ แบนเนอร์โปรโมตสินค้า สไตล์สดใส ชิ้นงานคมชัด',
      features: [
        'ขนาด A4 — เริ่มต้น 49.-',
        'ขนาด A3 — เริ่มต้น 69.-',
        'โปสเตอร์ประชาสัมพันธ์ — เริ่มต้น 79.-',
        'โปสเตอร์โปรโมตสินค้า / งานทั่วไป — เริ่มต้น 99.-'
      ]
    },
    {
      id: 'srv-code',
      icon: '⚡',
      title: 'งาน Coding & พัฒนาโปรแกรม',
      badge: 'วิศวกรรม AI • ตรวจสอบโค้ดก่อนส่ง',
      startingPrice: 'ประเมินตามรายละเอียด',
      desc: 'ดำเนินงานโดยนักศึกษาวิศวกรรม AI รับช่วยงานเขียนโค้ด แก้ไขบั๊ก สคริปต์อัตโนมัติ API และระบบฐานข้อมูล',
      features: [
        'ช่วยตรวจเช็ก Logic และหาสาเหตุ Error อย่างตรงจุด',
        'เขียนโค้ดสะอาด มี Comment อธิบายทุกฟังก์ชัน',
        'เชื่อมต่อฐานข้อมูล MySQL, SQLite, Supabase หรือ API',
        'ทดสอบระบบและเตรียมความพร้อมก่อนส่งมอบงาน'
      ]
    }
  ],
  pricing: [
    {
      id: 'prc-slide',
      badge: '📑 สไลด์งาน • เรท 1-30+ หน้า',
      title: 'สไลด์พรีเซนต์ & รายงาน',
      price: '49 - 229 ฿',
      desc: 'สไลด์นำเสนอส่งครู/อาจารย์ งานกลุ่ม สรุปเนื้อหาบทเรียน Pitch Deck ทำมือทุกงาน ไม่ใช้ AI เจนภาพ',
      isHighlight: false,
      features: [
        '1–5 หน้า 49.- / 6–10 หน้า 89.-',
        '11–15 หน้า 129.- / 16–20 หน้า 169.-',
        '21–30 หน้า 229.- (30+ หน้า ประเมินตามงาน)',
        'จัดทำด้วย PowerPoint หรือ Canva',
        'แก้ไขตามบรีฟได้ 1–2 รอบฟรี'
      ],
      actionText: 'สั่งทำสไลด์ / สอบถาม',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-poster',
      badge: '🖼️ โปสเตอร์ • A4 / A3 / โปรโมต',
      title: 'โปสเตอร์ & อินโฟกราฟิก',
      price: '49 - 99 ฿',
      desc: 'โปสเตอร์โครงงาน ม.ปลาย โปสเตอร์ประชาสัมพันธ์ แบนเนอร์โปรโมตสินค้า/งานทั่วไป ไฟล์คมชัดพร้อมพิมพ์',
      isHighlight: false,
      features: [
        'ขนาด A4 49.- / ขนาด A3 69.-',
        'โปสเตอร์ประชาสัมพันธ์ 79.-',
        'โปสเตอร์โปรโมตสินค้า / งานทั่วไป 99.-',
        'ไฟล์ความละเอียดสูง Print Ready คมชัด',
        'แก้ไขตามบรีฟได้ 1–2 รอบฟรี'
      ],
      actionText: 'สั่งทำโปสเตอร์ / สอบถาม',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-landing',
      badge: '⭐ ยอดนิยม • เว็บเริ่มต้น',
      title: 'เว็บ Contact / Landing Page',
      price: 'เริ่มต้น 149 ฿',
      desc: 'เหมาะสำหรับผู้ที่ต้องการหน้าเว็บแนะนำตัว ร้านค้า หรือรวมช่องทางติดต่อไว้ในที่เดียว โหลดไว รองรับมือถือ',
      isHighlight: true,
      features: [
        'เว็บ Contact / รวมช่องทางติดต่อในที่เดียว',
        'ดีไซน์ Responsive สวยงามรองรับมือถือ',
        'เชื่อมต่อปุ่มแชท LINE OA & Social Media',
        'ตรวจสอบโค้ดและทดสอบก่อนส่งมอบ',
        'แก้ไขตามบรีฟได้ 1–2 รอบฟรี'
      ],
      actionText: 'ปรึกษาทำเว็บ 149.-',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-portfolio',
      badge: '💳 เก็บผลงาน & แนะนำตัว',
      title: 'เว็บเก็บเครดิต / Portfolio',
      price: 'เริ่มต้น 199 ฿',
      desc: 'เหมาะสำหรับเก็บผลงาน แนะนำตัว รวม Social Media หรือใช้เป็นหน้า Portfolio ส่วนตัว',
      isHighlight: false,
      features: [
        'หน้า Showcase โชว์ผลงาน/รูปภาพ',
        'ระบบรวมเครดิตหรือรวม Social Media',
        'โครงสร้างโหลดไว สวยงาม ทันสมัย',
        'ตรวจสอบโค้ดและทดสอบก่อนส่งมอบ',
        'แก้ไขตามบรีฟได้ 1–2 รอบฟรี'
      ],
      actionText: 'ปรึกษาทำเว็บ 199.-',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-store',
      badge: '🏪 ร้านค้าเล็ก ๆ & ธุรกิจเริ่มต้น',
      title: 'เว็บหน้าร้านค้า แนะนำสินค้า',
      price: 'เริ่มต้น 299 ฿',
      desc: 'เหมาะสำหรับร้านค้าเล็ก ๆ หรือผู้ที่ต้องการมีเว็บไซต์สำหรับแนะนำสินค้าและบริการครบวงจร',
      isHighlight: false,
      features: [
        'หน้าแนะนำสินค้า & บริการครบถ้วน',
        'แคตตาล็อกสินค้าพร้อมรูปภาพและราคา',
        'ปุ่มกดสั่งซื้อทักแชท LINE OA สะดวก',
        'ตรวจสอบโค้ดและทดสอบก่อนส่งมอบ',
        'แก้ไขตามบรีฟได้ 1–2 รอบฟรี'
      ],
      actionText: 'ปรึกษาทำเว็บ 299.-',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    },
    {
      id: 'prc-custom',
      badge: '⚙️ ฟังก์ชันเฉพาะ • Senior Project',
      title: 'เว็บไซต์ที่มีฟังก์ชันเพิ่มเติม',
      price: 'ประเมินตามรายละเอียด',
      desc: 'ระบบหลังบ้าน (Admin Studio), ฟอร์ม, ระบบจัดการข้อมูล, โครงงาน ม.ปลาย หรือโปรเจกต์นักศึกษา',
      isHighlight: false,
      features: [
        'ระบบหลังบ้าน & จัดการฐานข้อมูล',
        'ฟอร์มส่งข้อมูล & REST API',
        'ดำเนินงานโดย นศ.วิศวกรรม AI',
        'ช่วยอธิบายและทดสอบระบบก่อนส่งมอบ',
        'ส่งโจทย์มาประเมินราคาฟรีก่อนเริ่มงาน'
      ],
      actionText: 'ส่งโจทย์มาประเมินฟรี',
      actionUrl: 'https://line.me/R/ti/p/@419ajynp'
    }
  ]
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(contentFilePath)) {
    fs.writeFileSync(contentFilePath, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf8');
  }
}

export function getSiteContent() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(contentFilePath, 'utf8');
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
  fs.writeFileSync(contentFilePath, JSON.stringify(fullContent, null, 2), 'utf8');
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
