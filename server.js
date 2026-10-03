const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'credit-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) && allowed.test(mime)) {
      return cb(null, true);
    }
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF) เท่านั้น'));
  }
});

// Default initial database state for SUNFZ
const initialData = {
  settings: {
    shopName: 'SUNFZ',
    tagline: 'รวมหลักฐานและเครดิตการซื้อขายจริง เช็คประวัติได้ที่นี่ 100%',
    announcement: '✨ รวมเครดิตซื้อขายร้าน SUNFZ ซื้อขายปลอดภัย มีหลักฐานทุกรายการ!',
    adminPin: '1234',
    socials: {
      facebook: { label: 'Facebook Fanpage', url: 'https://facebook.com', enabled: true },
      line: { label: 'Line ID: @sunfz', url: 'https://line.me', enabled: true },
      discord: { label: 'Discord Server', url: 'https://discord.gg', enabled: true },
      tiktok: { label: 'TikTok Shop', url: '', enabled: false }
    },
    stats: {
      ratingScore: '5.0',
      totalOrders: 'เครดิตจริง 100%',
      deliveryRate: 'ส่งไว ปลอดภัย',
      responseTime: 'ไม่กี่นาที',
      warrantyPeriod: 'มีประกัน'
    }
  },
  categories: ['ทั้งหมด', 'ทั่วไป'],
  credits: [
    {
      id: 'sample-1',
      title: 'ไอดี Genshin Impact C6 Furina + Sign R1 & 24 ตัว 5 ดาว',
      game: 'ไอดีเกม',
      price: 4500,
      customer: 'คุณธนภัทร',
      rating: 5,
      date: '2026-10-03',
      timeAgo: '10 นาทีที่แล้ว',
      images: ['/images/sample-genshin.svg'],
      description: 'ส่งมอบเรียบร้อย ลูกค้าเช็คไอดีถูกต้อง โอนเงินไวมากครับ ขอบคุณที่ไว้วางใจ!',
      isPinned: true,
      createdAt: '2026-10-03T03:50:40.631Z'
    },
    {
      id: 'sample-2',
      title: 'บัญชีพรีเมียม 1 ปี ใช้งานได้ยาวๆ ไม่หลุด',
      game: 'แอพพรีเมียม',
      price: 490,
      customer: 'คุณนนท์',
      rating: 5,
      date: '2026-10-03',
      timeAgo: '2 ชม. ที่แล้ว',
      images: ['/images/sample-starrail.svg'],
      description: 'ส่งเมลและรหัสให้เรียบร้อย ล็อกอินผ่านฉลุย ขอบคุณครับ',
      isPinned: true,
      createdAt: '2026-10-03T01:50:40.631Z'
    },
    {
      id: 'sample-3',
      title: 'เติมแพ็กรายเดือน / เติมเกมส่งไว',
      game: 'เติมเกม',
      price: 179,
      customer: 'คุณกอล์ฟ',
      rating: 5,
      date: '2026-10-02',
      timeAgo: 'เมื่อวานนี้',
      images: ['/images/sample-genshin.svg'],
      description: 'โอนปุ๊บเติมปั๊บ เข้าทันทีภายใน 2 นาทีครับ',
      isPinned: false,
      createdAt: '2026-10-02T10:30:00.000Z'
    }
  ]
};

// Database helper functions with atomic write
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);

    // If it was wrapped in shops.sunfz, unwrap cleanly
    if (data.shops && data.shops.sunfz) {
      const unwrapped = {
        settings: {
          shopName: data.shops.sunfz.shopName || 'SUNFZ',
          tagline: data.shops.sunfz.tagline || initialData.settings.tagline,
          announcement: data.shops.sunfz.announcement || initialData.settings.announcement,
          adminPin: data.shops.sunfz.adminPin || '1234',
          socials: data.shops.sunfz.socials || initialData.settings.socials,
          stats: data.shops.sunfz.stats || initialData.settings.stats
        },
        categories: data.shops.sunfz.categories || initialData.categories,
        credits: data.shops.sunfz.credits || initialData.credits
      };
      writeDB(unwrapped);
      return unwrapped;
    }

    if (!data.settings) return initialData;
    return data;
  } catch (err) {
    console.error('Error reading database:', err);
    return initialData;
  }
}

function writeDB(data) {
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

// HMAC based stateless admin sessions
const SESSION_SECRET = process.env.SESSION_SECRET || 'game-credits-store-secret-2026-key';
const revokedTokens = new Set();

function generateSessionToken() {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex')
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  return `${b64}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(b64).digest('base64url');
  if (signature !== expectedSignature) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch (e) {
    return false;
  }
}

// Auth Middleware
function requireAdmin(req, res, next) {
  const token = req.cookies['admin_token'] || req.headers['x-admin-token'];
  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบในฐานะแอดมิน' });
  }
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// PUBLIC ROUTES
// ========================

// Get public shop settings & categories
app.get('/api/public/settings', (req, res) => {
  const db = readDB();
  const safeSettings = {
    shopName: db.settings.shopName,
    tagline: db.settings.tagline,
    announcement: db.settings.announcement,
    socials: db.settings.socials,
    stats: {
      ...db.settings.stats,
      totalCredits: db.credits ? db.credits.length : 0,
      totalSoldAmount: (db.credits || []).reduce((acc, c) => acc + (Number(c.price) || 0), 0)
    }
  };
  res.json({
    success: true,
    settings: safeSettings,
    categories: db.categories || []
  });
});

// Get credits with filtering and search
app.get('/api/public/credits', (req, res) => {
  const db = readDB();
  let credits = [...(db.credits || [])];

  const { search, category, sort } = req.query;

  // Filter by category
  if (category && category !== 'ทั้งหมด') {
    credits = credits.filter(c => c.game === category);
  }

  // Search
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    credits = credits.filter(c => 
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.customer && c.customer.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.price && c.price.toString().includes(q))
    );
  }

  // Sort
  if (sort === 'price-high') {
    credits.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sort === 'price-low') {
    credits.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else {
    // Default: Pinned first, then newest
    credits.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    });
  }

  res.json({ success: true, credits });
});

// Get single credit details
app.get('/api/public/credits/:id', (req, res) => {
  const db = readDB();
  const credit = (db.credits || []).find(c => c.id === req.params.id);
  if (!credit) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตนี้' });
  }
  res.json({ success: true, credit });
});

// ========================
// AUTH ROUTES
// ========================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const db = readDB();

  if (!pin || pin.toString() !== db.settings.adminPin.toString()) {
    return res.status(400).json({ success: false, message: 'รหัสผ่าน / PIN แอดมินไม่ถูกต้อง' });
  }

  const token = generateSessionToken();
  res.cookie('admin_token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  res.json({ success: true, token, message: 'เข้าสู่ระบบแอดมินสำเร็จ' });
});

// Admin check session status
app.get('/api/admin/check', (req, res) => {
  const token = req.cookies['admin_token'] || req.headers['x-admin-token'];
  if (token && verifySessionToken(token)) {
    return res.json({ success: true, isAdmin: true });
  }
  res.json({ success: false, isAdmin: false });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies['admin_token'] || req.headers['x-admin-token'];
  if (token) {
    revokedTokens.add(token);
  }
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'ออกจากระบบเรียบร้อย' });
});

// ========================
// ADMIN MANAGEMENT ROUTES
// ========================

// Create new credit with file upload
app.post('/api/admin/credits', requireAdmin, upload.array('images', 5), (req, res) => {
  try {
    const { title, game, price, customer, rating, date, description, isPinned } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ / สินค้าที่ขาย' });
    }

    const itemCategory = (game && game.trim()) ? game.trim() : 'ทั่วไป';
    const db = readDB();
    if (!db.credits) db.credits = [];

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(f => '/uploads/' + f.filename);
    } else if (req.body.imageUrl) {
      imagePaths = [req.body.imageUrl];
    } else {
      imagePaths = ['/images/placeholder-credit.svg'];
    }

    const newCredit = {
      id: 'cr-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      title: title.trim(),
      game: itemCategory,
      price: price ? Number(price) : 0,
      customer: customer ? customer.trim() : 'ลูกค้าทั่วไป',
      rating: rating ? Number(rating) : 5,
      date: date || new Date().toISOString().split('T')[0],
      images: imagePaths,
      description: description ? description.trim() : '',
      isPinned: isPinned === 'true' || isPinned === true,
      createdAt: new Date().toISOString()
    };

    db.credits.unshift(newCredit);
    writeDB(db);

    res.json({ success: true, credit: newCredit, message: 'เพิ่มเครดิตสำเร็จเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error creating credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกเครดิต: ' + err.message });
  }
});

// Update credit
app.put('/api/admin/credits/:id', requireAdmin, upload.array('images', 5), (req, res) => {
  try {
    const { title, game, price, customer, rating, date, description, isPinned, keepExistingImages } = req.body;
    const db = readDB();
    const index = (db.credits || []).findIndex(c => c.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตที่ต้องการแก้ไข' });
    }

    const existing = db.credits[index];
    let newImages = [];

    if (req.files && req.files.length > 0) {
      const uploaded = req.files.map(f => '/uploads/' + f.filename);
      if (keepExistingImages === 'true' || keepExistingImages === true) {
        newImages = [...(existing.images || []), ...uploaded];
      } else {
        newImages = uploaded;
      }
    } else {
      newImages = existing.images || ['/images/placeholder-credit.svg'];
    }

    db.credits[index] = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      game: game !== undefined ? game.trim() : existing.game,
      price: price !== undefined ? Number(price) : existing.price,
      customer: customer !== undefined ? customer.trim() : existing.customer,
      rating: rating !== undefined ? Number(rating) : existing.rating,
      date: date || existing.date,
      images: newImages,
      description: description !== undefined ? description.trim() : existing.description,
      isPinned: isPinned !== undefined ? (isPinned === 'true' || isPinned === true) : existing.isPinned,
      updatedAt: new Date().toISOString()
    };

    writeDB(db);
    res.json({ success: true, credit: db.credits[index], message: 'อัปเดตข้อมูลเครดิตเรียบร้อย' });
  } catch (err) {
    console.error('Error updating credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต: ' + err.message });
  }
});

// Delete credit
app.delete('/api/admin/credits/:id', requireAdmin, (req, res) => {
  try {
    const db = readDB();
    const item = (db.credits || []).find(c => c.id === req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'ไม่พบเครดิตที่ต้องการลบ' });
    }

    if (item.images && Array.isArray(item.images)) {
      item.images.forEach(imgPath => {
        if (imgPath.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', imgPath);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      });
    }

    db.credits = db.credits.filter(c => c.id !== req.params.id);
    writeDB(db);

    res.json({ success: true, message: 'ลบรายการเครดิตเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error deleting credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบ: ' + err.message });
  }
});

// Toggle pin credit
app.put('/api/admin/credits/:id/pin', requireAdmin, (req, res) => {
  const db = readDB();
  const credit = (db.credits || []).find(c => c.id === req.params.id);
  if (!credit) {
    return res.status(404).json({ success: false, message: 'ไม่พบเครดิต' });
  }
  credit.isPinned = !credit.isPinned;
  writeDB(db);
  res.json({ success: true, isPinned: credit.isPinned, message: credit.isPinned ? 'ปักหมุดเครดิตแล้ว' : 'ยกเลิกการปักหมุดแล้ว' });
});

// Update shop settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const { shopName, tagline, announcement, socials, stats } = req.body;
    const db = readDB();

    if (shopName) db.settings.shopName = shopName.trim();
    if (tagline !== undefined) db.settings.tagline = tagline.trim();
    if (announcement !== undefined) db.settings.announcement = announcement.trim();
    if (socials) db.settings.socials = { ...db.settings.socials, ...socials };
    if (stats) db.settings.stats = { ...db.settings.stats, ...stats };

    writeDB(db);
    res.json({ success: true, settings: db.settings, message: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'บันทึกการตั้งค่าไม่สำเร็จ: ' + err.message });
  }
});

// Change admin PIN
app.post('/api/admin/change-pin', requireAdmin, (req, res) => {
  const { currentPin, newPin } = req.body;
  const db = readDB();

  if (currentPin.toString() !== db.settings.adminPin.toString()) {
    return res.status(400).json({ success: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' });
  }

  if (!newPin || newPin.toString().length < 4) {
    return res.status(400).json({ success: false, message: 'PIN ใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
  }

  db.settings.adminPin = newPin.toString().trim();
  writeDB(db);
  res.json({ success: true, message: 'เปลี่ยนรหัสผ่าน / PIN แอดมินสำเร็จแล้ว' });
});

// Export Database JSON backup
app.get('/api/admin/export', requireAdmin, (req, res) => {
  const db = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=credits-backup-${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

// Import Database JSON
app.post('/api/admin/import', requireAdmin, upload.single('backupFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์สำรองข้อมูล JSON' });
    }
    const content = fs.readFileSync(req.file.path, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed.settings || !Array.isArray(parsed.credits)) {
      return res.status(400).json({ success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' });
    }
    writeDB(parsed);
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    res.json({ success: true, message: 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ: ' + err.message });
  }
});

// ========================
// PAGE ROUTING
// ========================

// Dedicated Admin Web App route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html for customer storefront
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🎮 SUNFZ Credits Store Web Server is RUNNING!`);
  console.log(`🌐 Public Website: http://localhost:${PORT}`);
  console.log(`🔑 Admin Studio:  http://localhost:${PORT}/admin`);
  console.log(`📌 Default PIN:    1234`);
  console.log(`======================================================\n`);
});
