require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbService = require('./supabaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// Keep uploads in memory; they are sent straight to Supabase Storage.
const upload = multer({
  storage: multer.memoryStorage(),
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

// Upload to Supabase Storage. No disk fallback: Render wipes the disk on restart.
function saveUploadedFile(file) {
  return dbService.uploadImage(file.buffer, file.originalname, file.mimetype);
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
app.get('/api/public/settings', async (req, res) => {
  try {
    const config = await dbService.getShopConfig();
    const allCredits = await dbService.getCredits();

    const safeSettings = {
      shopName: config.settings.shopName,
      tagline: config.settings.tagline,
      announcement: config.settings.announcement,
      socials: config.settings.socials,
      stats: {
        ...config.settings.stats,
        totalCredits: allCredits ? allCredits.length : 0,
        totalSoldAmount: (allCredits || []).reduce((acc, c) => acc + (Number(c.price) || 0), 0)
      }
    };

    res.json({
      success: true,
      settings: safeSettings,
      categories: config.categories || []
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลร้านค้าได้' });
  }
});

// Get credits with filtering and search
app.get('/api/public/credits', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const credits = await dbService.getCredits({ search, category, sort });
    res.json({ success: true, credits });
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรายการเครดิตได้' });
  }
});

// Get single credit details
app.get('/api/public/credits/:id', async (req, res) => {
  try {
    const credit = await dbService.getCreditById(req.params.id);
    if (!credit) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตนี้' });
    }
    res.json({ success: true, credit });
  } catch (err) {
    console.error('Error fetching single credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดเครดิต' });
  }
});

// Get customer reviews (+1 / -1)
app.get('/api/public/reviews', async (req, res) => {
  try {
    const reviews = await dbService.getCustomerReviews();
    const positiveCount = reviews.filter(r => r.type === '+1').length;
    const negativeCount = reviews.filter(r => r.type === '-1').length;
    res.json({
      success: true,
      reviews,
      counts: {
        positive: positiveCount,
        negative: negativeCount,
        total: reviews.length
      }
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรีวิวได้' });
  }
});

// Submit customer review (+1 or -1 with evidence)
app.post('/api/public/reviews', upload.array('images', 5), async (req, res) => {
  try {
    const { type, customerName, message } = req.body;
    const reviewType = (type === '-1') ? '-1' : '+1';

    // Validation: Both +1 and -1 require proof image to prevent spam!
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: reviewType === '+1'
          ? 'การให้เครดิต +1 จำเป็นต้องแนบหลักฐานการซื้อขาย (สลิปหรือภาพแชท) เพื่อป้องกันสแปม'
          : 'การให้เครดิต -1 จำเป็นต้องแนบรูปภาพหลักฐาน (สลิปหรือภาพแชท) เพื่อยืนยันความโปร่งใส'
      });
    }

    if (reviewType === '-1') {
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกรายละเอียดปัญหาหรือเหตุผลสำหรับการให้ -1'
        });
      }
    }

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const savedUrl = await saveUploadedFile(file);
        imagePaths.push(savedUrl);
      }
    }

    const review = await dbService.createCustomerReview({
      type: reviewType,
      customerName: (customerName && customerName.trim()) ? customerName.trim() : 'ลูกค้าทั่วไป',
      message: message ? message.trim() : '',
      images: imagePaths
    });

    res.json({
      success: true,
      review,
      message: reviewType === '+1' ? 'ส่งรีวิว +1 เรียบร้อยแล้ว ขอบคุณสำหรับกำลังใจครับ!' : 'ส่งรายงาน -1 พร้อมหลักฐานเรียบร้อยแล้ว ทางร้านจะเร่งตรวจสอบครับ'
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกรีวิว: ' + err.message });
  }
});

// ========================
// AUTH ROUTES
// ========================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { pin } = req.body;
    const config = await dbService.getShopConfig();
    const adminPin = (config.settings && config.settings.adminPin) ? config.settings.adminPin.toString() : '1234';

    if (!pin || pin.toString() !== adminPin) {
      return res.status(400).json({ success: false, message: 'รหัสผ่าน / PIN แอดมินไม่ถูกต้อง' });
    }

    const token = generateSessionToken();
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({ success: true, token, message: 'เข้าสู่ระบบแอดมินสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
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
app.post('/api/admin/credits', requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { title, game, price, customer, rating, date, description, isPinned } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ / สินค้าที่ขาย' });
    }

    const itemCategory = (game && game.trim()) ? game.trim() : 'ทั่วไป';

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const savedUrl = await saveUploadedFile(file);
        imagePaths.push(savedUrl);
      }
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

    const created = await dbService.createCredit(newCredit);

    res.json({ success: true, credit: created, message: 'เพิ่มเครดิตสำเร็จเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error creating credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกเครดิต: ' + err.message });
  }
});

// Update credit
app.put('/api/admin/credits/:id', requireAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { title, game, price, customer, rating, date, description, isPinned, keepExistingImages } = req.body;
    const existing = await dbService.getCreditById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตที่ต้องการแก้ไข' });
    }

    let newImages = [];
    if (req.files && req.files.length > 0) {
      const uploaded = [];
      for (const file of req.files) {
        const savedUrl = await saveUploadedFile(file);
        uploaded.push(savedUrl);
      }
      if (keepExistingImages === 'true' || keepExistingImages === true) {
        newImages = [...(existing.images || []), ...uploaded];
      } else {
        newImages = uploaded;
      }
    } else {
      newImages = existing.images || ['/images/placeholder-credit.svg'];
    }

    const updates = {
      title: title !== undefined ? title.trim() : existing.title,
      game: game !== undefined ? game.trim() : existing.game,
      price: price !== undefined ? Number(price) : existing.price,
      customer: customer !== undefined ? customer.trim() : existing.customer,
      rating: rating !== undefined ? Number(rating) : existing.rating,
      date: date || existing.date,
      images: newImages,
      description: description !== undefined ? description.trim() : existing.description,
      isPinned: isPinned !== undefined ? (isPinned === 'true' || isPinned === true) : existing.isPinned
    };

    const updated = await dbService.updateCredit(req.params.id, updates);
    res.json({ success: true, credit: updated, message: 'อัปเดตข้อมูลเครดิตเรียบร้อย' });
  } catch (err) {
    console.error('Error updating credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต: ' + err.message });
  }
});

// Delete credit
app.delete('/api/admin/credits/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await dbService.getCreditById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบเครดิตที่ต้องการลบ' });
    }

    // Clean up local uploads if applicable
    if (existing.images && Array.isArray(existing.images)) {
      existing.images.forEach(imgPath => {
        if (imgPath.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, 'public', imgPath);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      });
    }

    await dbService.deleteCredit(req.params.id);
    res.json({ success: true, message: 'ลบรายการเครดิตเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error deleting credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบ: ' + err.message });
  }
});

// Toggle pin credit
app.put('/api/admin/credits/:id/pin', requireAdmin, async (req, res) => {
  try {
    const newPinned = await dbService.togglePinCredit(req.params.id);
    if (newPinned === null) {
      return res.status(404).json({ success: false, message: 'ไม่พบเครดิต' });
    }
    res.json({
      success: true,
      isPinned: newPinned,
      message: newPinned ? 'ปักหมุดเครดิตแล้ว' : 'ยกเลิกการปักหมุดแล้ว'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});

// Delete customer review (+1 or -1)
app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    await dbService.deleteCustomerReview(req.params.id);
    res.json({ success: true, message: 'ลบรายการรีวิวเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบรีวิว' });
  }
});

// Update shop settings
app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { shopName, tagline, announcement, socials, stats, categories } = req.body;
    const config = await dbService.getShopConfig();

    const newSettings = {};
    if (shopName) newSettings.shopName = shopName.trim();
    if (tagline !== undefined) newSettings.tagline = tagline.trim();
    if (announcement !== undefined) newSettings.announcement = announcement.trim();
    if (socials) newSettings.socials = { ...config.settings.socials, ...socials };
    if (stats) newSettings.stats = { ...config.settings.stats, ...stats };

    const updatedSettings = await dbService.updateShopSettings(newSettings);

    if (categories && Array.isArray(categories)) {
      await dbService.updateCategories(categories);
    }

    res.json({ success: true, settings: updatedSettings, message: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'บันทึกการตั้งค่าไม่สำเร็จ: ' + err.message });
  }
});

// Change admin PIN
app.post('/api/admin/change-pin', requireAdmin, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const config = await dbService.getShopConfig();
    const adminPin = (config.settings && config.settings.adminPin) ? config.settings.adminPin.toString() : '1234';

    if (currentPin.toString() !== adminPin) {
      return res.status(400).json({ success: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' });
    }

    if (!newPin || newPin.toString().length < 4) {
      return res.status(400).json({ success: false, message: 'PIN ใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
    }

    await dbService.updateShopSettings({ adminPin: newPin.toString().trim() });
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่าน / PIN แอดมินสำเร็จแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยน PIN: ' + err.message });
  }
});

// Export Database JSON backup
app.get('/api/admin/export', requireAdmin, async (req, res) => {
  try {
    const config = await dbService.getShopConfig();
    const credits = await dbService.getCredits();
    const backup = {
      settings: config.settings,
      categories: config.categories,
      credits: credits
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=credits-backup-${Date.now()}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: 'ไม่สามารถ Export ข้อมูลได้' });
  }
});

// Import Database JSON
app.post('/api/admin/import', requireAdmin, multer().single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์สำรองข้อมูล JSON' });
    }
    const content = req.file.buffer.toString('utf8');
    const parsed = JSON.parse(content);
    if (!parsed.settings || !Array.isArray(parsed.credits)) {
      return res.status(400).json({ success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' });
    }

    await dbService.updateShopSettings(parsed.settings);
    if (parsed.categories) {
      await dbService.updateCategories(parsed.categories);
    }
    for (const c of parsed.credits) {
      const existing = await dbService.getCreditById(c.id);
      if (existing) {
        await dbService.updateCredit(c.id, c);
      } else {
        await dbService.createCredit(c);
      }
    }

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

// Start Server (only after confirming Supabase is reachable)
let server;
dbService.healthCheck().then(() => {
  server = app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎮 SUNFZENITH Credits Store Web Server is RUNNING!`);
    console.log(`🌐 Public Website: http://localhost:${PORT}`);
    console.log(`🔑 Admin Studio:  http://localhost:${PORT}/admin`);
    console.log(`⚡ Supabase:       เชื่อมต่อสำเร็จ`);
    console.log(`======================================================\n`);
  });
  server.on('error', onServerError);
}).catch((err) => {
  console.error('\n❌ เชื่อมต่อ Supabase ไม่ได้:', err.message);
  console.error('   ตรวจสอบ SUPABASE_URL / SUPABASE_KEY และว่ารัน supabase_schema.sql แล้ว\n');
  process.exit(1);
});

function onServerError(err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} กำลังถูกใช้งานอยู่โดยโปรแกรมอื่น`);
    console.error(`กรุณาปิดโปรแกรมที่ใช้ Port ${PORT} ก่อน หรือเปลี่ยน PORT ในไฟล์ .env\n`);
  } else {
    console.error('\n❌ Server error:', err.message);
  }
  process.exit(1);
}

