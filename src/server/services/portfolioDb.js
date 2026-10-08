import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const dataDir = path.join(rootDir, 'src', 'server', 'data');
const portfolioFilePath = path.join(dataDir, 'portfolio.json');

export const SEED_PORTFOLIO = [
  {
    id: 'p1',
    title: 'Smart Pharmacy Locker — ตู้รับยาอัจฉริยะ IoT',
    category: 'website',
    categoryLabel: 'Web App & IoT',
    desc: 'นวัตกรรมตู้รับยาอัตโนมัติพร้อมระบบสายพานลำเลียง จุดตรวจความปลอดภัย 5 Rights และ AI เสียงพูดภาษาไทยแนะนำวิธีทานยาเพื่อผู้สูงอายุ',
    tech: ['React 19', 'Tailwind CSS', 'ESP32 IoT', 'Web Speech API', 'Vite'],
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves/smart-pharmacy-locker',
    demoLabel: 'ดูโปรเจกต์บน GitHub',
    isReal: true,
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'p2',
    title: 'SUNFZENITH Credits & Review Platform',
    category: 'website',
    categoryLabel: 'Live Web Platform',
    desc: 'แพลตฟอร์มสมุดรวมเครดิตการซื้อขายออนไลน์แบบเรียลไทม์ พร้อมระบบส่งสลิปหลักฐานยืนยันความปลอดภัย เช็คประวัติได้โปร่งใส 100%',
    tech: ['Node.js', 'Express', 'Supabase PostgreSQL', 'Storage', 'Vanilla JS'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    demoUrl: '/credits',
    demoLabel: 'เข้าชมระบบจริง',
    isReal: true,
    createdAt: '2026-09-05T00:00:00.000Z'
  },
  {
    id: 'p3',
    title: 'DocuMind AI — Enterprise Document Intelligence',
    category: 'coding',
    categoryLabel: 'AI & RAG Platform',
    desc: 'แพลตฟอร์มคลังความรู้และตอบคำถามเอกสารองค์กรด้วย Clean Architecture บน FastAPI, pgvector และ Google Gemini พร้อม Real-time SSE Streaming',
    tech: ['Python', 'FastAPI', 'PostgreSQL (pgvector)', 'Gemini API', 'Docker'],
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves',
    demoLabel: 'ดูสถาปัตยกรรมระบบ',
    isReal: true,
    createdAt: '2026-09-10T00:00:00.000Z'
  },
  {
    id: 'p4',
    title: 'Multi-Agent Semantic Firewall (งานวิจัยตีพิมพ์ AUCC)',
    category: 'coding',
    categoryLabel: 'AI Research & Paper',
    desc: 'บทความวิจัยและโมเดลตรวจสอบข้อเท็จจริง ลดความผิดพลาดของโมเดลภาษา LLM จาก 60% เหลือ 5% (นำเสนอในการประชุมวิชาการ AUCC 2025)',
    tech: ['Python', 'Multi-Agent System', 'Fact-Checking', 'Search API', 'FastAPI'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves',
    demoLabel: 'ดูรายละเอียดงานวิจัย',
    isReal: true,
    createdAt: '2026-09-15T00:00:00.000Z'
  },
  {
    id: 'p5',
    title: 'สไลด์นำเสนอโครงงานนวัตกรรม DailyRipe & บรรจุภัณฑ์กล้วย',
    category: 'presentation',
    categoryLabel: 'Slide Deck & Presentation',
    desc: 'งานออกแบบสไลด์นำเสนอโครงงานนวัตกรรมบรรจุภัณฑ์กล้วยและ DailyRipe กราฟิกย่อยข้อมูลง่าย เล่าเรื่องชัดเจน โทนสีและเลย์เอาต์ระดับมืออาชีพ',
    tech: ['PowerPoint', 'Canva', 'Graphic Layout', 'Data Visualization'],
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://line.me/ti/p/~luvxawrnrkc',
    demoLabel: 'ปรึกษางานสไลด์',
    isReal: true,
    createdAt: '2026-09-20T00:00:00.000Z'
  },
  {
    id: 'p6',
    title: 'Part-Time Job Matching System (ระบบจัดหางานพาร์ตไทม์)',
    category: 'website',
    categoryLabel: 'Web Application',
    desc: 'ระบบจับคู่งานพาร์ตไทม์สำหรับนักศึกษาเพื่อหารายได้ระหว่างเรียน ค้นหาตามเขตพื้นที่ สมัครงานออนไลน์ และแดชบอร์ดหลังบ้านสำหรับนายจ้าง',
    tech: ['PHP', 'MySQL', 'JavaScript', 'Bootstrap', 'HTML5 / CSS3'],
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves',
    demoLabel: 'ดูโครงสร้างโปรเจกต์',
    isReal: true,
    createdAt: '2026-09-25T00:00:00.000Z'
  },
  {
    id: 'p7',
    title: 'FruitLeaf AI — โรคผลไม้ไทย & 3D Interactive Model',
    category: 'design',
    categoryLabel: '3D Model & Web UI',
    desc: 'เว็บแอปพลิเคชันสืบค้นโรคผลไม้ไทยพร้อมโมเดลผลไม้ 3 มิติแบบหมุนโต้ตอบได้ด้วย Three.js Low-Poly Procedural Viewer และฐานข้อมูล 30 โรค',
    tech: ['Three.js', 'Python', 'Flask', '3D Low-Poly', 'UI/UX Design'],
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves',
    demoLabel: 'ดูรายละเอียด 3D UI',
    isReal: true,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'p8',
    title: 'ระบบบริหารจัดการกระชังปลา (Fish Cage Dashboard & DB)',
    category: 'website',
    categoryLabel: 'Web Dashboard & DB',
    desc: 'ระบบฐานข้อมูลและเว็บแอปพลิเคชันบริหารจัดการกระชังปลา ติดตามต้นทุน รายรับ-กำไรขาดทุนแต่ละกระชัง พร้อม SQL Stored Procedure & ERD',
    tech: ['Node.js', 'Express', 'MySQL', 'ERD Design', 'SQL Stored Procedure'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    demoUrl: 'https://github.com/underwaves',
    demoLabel: 'ดูโครงสร้างระบบ',
    isReal: true,
    createdAt: '2026-10-03T00:00:00.000Z'
  },
  {
    id: 'p9',
    title: 'ป้ายเครดิต & แบนเนอร์ซื้อขาย (Genshin Impact — Eula Theme)',
    category: 'design',
    categoryLabel: 'Graphic & Banner',
    desc: 'งานออกแบบป้ายเครดิตการซื้อขายเกม Genshin Impact ธีม Eula โทนสีฟ้าน้ำแข็ง พรีเมียม พร้อมการ์ดสรุปประวัติความน่าเชื่อถือ +1 / -1 ชัดเจน โดดเด่น',
    tech: ['Photoshop', 'Graphic Design', 'Banner Layout', 'Typography'],
    image: '/images/portfolio-genshin-credit.png',
    demoUrl: '/images/portfolio-genshin-credit.png',
    demoLabel: 'ดูภาพผลงานเต็ม',
    isReal: true,
    createdAt: '2026-10-08T00:00:00.000Z'
  },
  {
    id: 'p10',
    title: 'โปสเตอร์ & ปกการ์ดวันแม่ 12 สิงหาคม (Mother\'s Day Poster)',
    category: 'design',
    categoryLabel: 'Poster & Card',
    desc: 'งานออกแบบโปสเตอร์และปกการ์ดวันแม่ โทนสีอบอุ่นสไตล์สีน้ำ (Watercolor) ภาพแม่โอบกอดลูกประดับซุ้มดอกมะลิ ให้ความรู้สึกละมุนและซาบซึ้งใจ',
    tech: ['Poster Design', 'Watercolor Art', 'Typography', 'Print Ready'],
    image: '/images/portfolio-mothers-day-poster.png',
    demoUrl: '/images/portfolio-mothers-day-poster.png',
    demoLabel: 'ดูภาพผลงานเต็ม',
    isReal: true,
    createdAt: '2026-10-08T00:00:01.000Z'
  },
  {
    id: 'p11',
    title: 'การ์ดอวยพรวันแม่ พวงมาลัยดอกมะลิ (Mother\'s Day Greeting Card)',
    category: 'design',
    categoryLabel: 'Card & Letter Design',
    desc: 'งานออกแบบการ์ดอวยพรวันแม่แบบกางสองหน้า ฝั่งซ้ายภาพวาดสีน้ำพวงมาลัยดอกมะลิวิจิตร ฝั่งขวาจัดวางเลย์เอาต์จดหมายบอกรักแม่ในกรอบพฤกษา เรียบหรูอบอุ่น',
    tech: ['Card Spread', 'Botanical Art', 'Layout Design', 'Typography'],
    image: '/images/portfolio-mothers-day-card.png',
    demoUrl: '/images/portfolio-mothers-day-card.png',
    demoLabel: 'ดูภาพผลงานเต็ม',
    isReal: true,
    createdAt: '2026-10-08T00:00:02.000Z'
  }
];

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(portfolioFilePath)) {
    fs.writeFileSync(portfolioFilePath, JSON.stringify(SEED_PORTFOLIO, null, 2), 'utf8');
  }
}

export function getAllPortfolio() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(portfolioFilePath, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [...SEED_PORTFOLIO];
  } catch (err) {
    console.error('[portfolioDb] Error reading portfolio file:', err);
    return [...SEED_PORTFOLIO];
  }
}

export function getPortfolioById(id) {
  const list = getAllPortfolio();
  return list.find((item) => item.id === id) || null;
}

export function savePortfolioList(list) {
  ensureDataFile();
  fs.writeFileSync(portfolioFilePath, JSON.stringify(list, null, 2), 'utf8');
}

export function createPortfolio(data) {
  const list = getAllPortfolio();
  const id = `p-${Date.now()}`;
  const newItem = {
    id,
    title: data.title?.trim() || 'Untitled Work',
    category: data.category?.trim() || 'design',
    categoryLabel: data.categoryLabel?.trim() || 'Graphic Design',
    desc: data.desc?.trim() || '',
    tech: Array.isArray(data.tech) ? data.tech : (data.tech ? data.tech.split(',').map((t) => t.trim()).filter(Boolean) : []),
    image: data.image?.trim() || '/images/placeholder-credit.svg',
    demoUrl: data.demoUrl?.trim() || data.image?.trim() || '#',
    demoLabel: data.demoLabel?.trim() || 'ดูภาพผลงานเต็ม',
    isReal: data.isReal !== false,
    createdAt: new Date().toISOString()
  };

  // Add at the beginning of the list for newest works
  list.unshift(newItem);
  savePortfolioList(list);
  return newItem;
}

export function updatePortfolio(id, updates) {
  const list = getAllPortfolio();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const current = list[index];
  const updatedItem = {
    ...current,
    ...updates,
    id: current.id, // prevent overwriting id
    tech: Array.isArray(updates.tech)
      ? updates.tech
      : (updates.tech ? updates.tech.split(',').map((t) => t.trim()).filter(Boolean) : current.tech),
    updatedAt: new Date().toISOString()
  };

  list[index] = updatedItem;
  savePortfolioList(list);
  return updatedItem;
}

export function deletePortfolio(id) {
  const list = getAllPortfolio();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) return false;
  savePortfolioList(filtered);
  return true;
}
