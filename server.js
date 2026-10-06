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

// ========================
// SECURITY HEADERS & CORS
// ========================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

// ========================
// RATE LIMITING (In-Memory, Zero-Dependency)
// ========================
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now - record.resetTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, 60000).unref();

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message: message || 'คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      });
    }

    next();
  };
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: 'คุณพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง'
});

const reviewLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 5,
  message: 'คุณส่งข้อมูลถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้งเพื่อป้องกันสแปม'
});

const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  message: 'คำขอถี่เกินไป กรุณารอสักครู่'
});

app.use('/api/', generalApiLimiter);

// ========================
// FILE UPLOAD & MAGIC BYTES VALIDATION
// ========================

// Inspect file buffer magic numbers (prevents disguised SVG, HTML, scripts)
function detectImageMime(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return { mime: 'image/png', ext: '.png' };
  }
  // WebP: RIFF....WEBP
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', ext: '.webp' };
  }
  // GIF: GIF87a or GIF89a
  if (buffer.slice(0, 4).toString('ascii') === 'GIF8') {
    return { mime: 'image/gif', ext: '.gif' };
  }
  return null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (allowed.test(ext) && allowed.test(mime)) {
      return cb(null, true);
    }
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF) ขนาดไม่เกิน 5MB เท่านั้น'));
  }
});

// Process, validate magic bytes, and upload with automatic rollback on error
async function processUploadedImages(files) {
  if (!files || !files.length) return [];
  const uploadedUrls = [];
  const uploadedFileNames = [];

  try {
    for (const file of files) {
      const detected = detectImageMime(file.buffer);
      if (!detected) {
        throw new Error(`ไฟล์ "${file.originalname}" ไม่ใช่รูปภาพที่ถูกต้อง (ไม่อนุญาตให้อัปโหลดไฟล์ที่ไม่ใช่รูปภาพแท้จริง)`);
      }
      const { url, fileName } = await dbService.uploadImage(file.buffer, detected.ext, detected.mime);
      uploadedUrls.push(url);
      uploadedFileNames.push(fileName);
    }
    return uploadedUrls;
  } catch (err) {
    // Rollback any images uploaded before the failure!
    if (uploadedFileNames.length > 0) {
      await dbService.deleteImagesFromStorage(uploadedFileNames);
    }
    throw err;
  }
}

// ========================
// HMAC ADMIN SESSION AUTH
// ========================
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

function requireAdmin(req, res, next) {
  const token = req.cookies['admin_token'] || req.headers['x-admin-token'];
  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบในฐานะแอดมิน' });
  }
  next();
}

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

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
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลร้านค้าได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Get credits with filtering and search
app.get('/api/public/credits', async (req, res) => {
  try {
    let { search, category, sort } = req.query;
    if (typeof search === 'string') search = search.slice(0, 100);
    if (typeof category === 'string') category = category.slice(0, 50);

    const credits = await dbService.getCredits({ search, category, sort });
    res.json({ success: true, credits });
  } catch (err) {
    console.error('Error fetching credits:', err);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรายการเครดิตได้ กรุณาลองใหม่อีกครั้ง' });
  }
});

// Get single credit details
app.get('/api/public/credits/:id', async (req, res) => {
  try {
    const id = req.params.id ? String(req.params.id).slice(0, 100) : '';
    const credit = await dbService.getCreditById(id);
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
app.post('/api/public/reviews', reviewLimiter, upload.array('images', MAX_FILES), async (req, res) => {
  let uploadedImages = [];
  try {
    const { type, customerName, message } = req.body;
    const reviewType = (type === '-1') ? '-1' : '+1';

    // Strict Validation: Both +1 and -1 require proof image!
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: reviewType === '+1'
          ? 'การให้เครดิต +1 จำเป็นต้องแนบหลักฐานการซื้อขาย (สลิปหรือภาพแชท) เพื่อยืนยันและป้องกันสแปม'
          : 'การให้เครดิต -1 จำเป็นต้องแนบรูปภาพหลักฐาน (สลิปหรือภาพแชท) เพื่อยืนยันความถูกต้อง'
      });
    }

    if (req.files.length > MAX_FILES) {
      return res.status(400).json({
        success: false,
        message: `แนบรูปภาพได้สูงสุด ${MAX_FILES} รูปเท่านั้น`
      });
    }

    const cleanName = (customerName && typeof customerName === 'string')
      ? customerName.trim().slice(0, 100)
      : 'ลูกค้าทั่วไป';

    const cleanMsg = (message && typeof message === 'string')
      ? message.trim().slice(0, 1000)
      : '';

    if (reviewType === '-1' && !cleanMsg) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกรายละเอียดปัญหาหรือเหตุผลสำหรับการให้ -1'
      });
    }

    // Process and validate magic numbers with rollback
    uploadedImages = await processUploadedImages(req.files);

    const review = await dbService.createCustomerReview({
      type: reviewType,
      customerName: cleanName || 'ลูกค้าทั่วไป',
      message: cleanMsg,
      images: uploadedImages
    });

    res.json({
      success: true,
      review,
      message: reviewType === '+1'
        ? 'ส่งรีวิว +1 พร้อมหลักฐานเรียบร้อยแล้ว ขอบคุณสำหรับกำลังใจครับ!'
        : 'ส่งรายงาน -1 พร้อมหลักฐานเรียบร้อยแล้ว ทางร้านจะเร่งตรวจสอบครับ'
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    if (uploadedImages.length > 0) {
      await dbService.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({
      success: false,
      message: err.message.includes('รูปภาพ')
        ? err.message
        : 'เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้ง'
    });
  }
});

// ========================
// AUTH ROUTES
// ========================

// Admin Login
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const { pin } = req.body;
    const config = await dbService.getShopConfig();
    const adminPin = (config.settings && config.settings.adminPin) ? config.settings.adminPin.toString() : '3645';

    if (!pin || typeof pin !== 'string' && typeof pin !== 'number') {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัส PIN' });
    }

    const inputPinStr = pin.toString().trim();
    if (inputPinStr !== adminPin) {
      return res.status(400).json({ success: false, message: 'รหัสผ่าน / PIN แอดมินไม่ถูกต้อง' });
    }

    const token = generateSessionToken();
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({ success: true, token, message: 'เข้าสู่ระบบแอดมินสำเร็จ' });
  } catch (err) {
    console.error('Login error:', err);
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
app.post('/api/admin/credits', requireAdmin, upload.array('images', MAX_FILES), async (req, res) => {
  let uploadedImages = [];
  try {
    const { title, game, price, customer, rating, date, description, isPinned } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรายการ / สินค้าที่ขาย' });
    }

    const cleanTitle = title.trim().slice(0, 150);
    const itemCategory = (game && game.trim()) ? game.trim().slice(0, 50) : 'ทั่วไป';
    const cleanCustomer = (customer && customer.trim()) ? customer.trim().slice(0, 100) : 'ลูกค้าทั่วไป';
    const cleanDesc = description ? description.trim().slice(0, 2000) : '';
    const numericPrice = Math.max(0, Math.min(1000000000, Number(price) || 0));

    if (req.files && req.files.length > 0) {
      uploadedImages = await processUploadedImages(req.files);
    } else if (req.body.imageUrl && typeof req.body.imageUrl === 'string') {
      uploadedImages = [req.body.imageUrl.trim()];
    } else {
      uploadedImages = ['/images/placeholder-credit.svg'];
    }

    const newCredit = {
      id: 'cr-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      title: cleanTitle,
      game: itemCategory,
      price: numericPrice,
      customer: cleanCustomer,
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : 5,
      date: date || new Date().toISOString().split('T')[0],
      images: uploadedImages,
      description: cleanDesc,
      isPinned: isPinned === 'true' || isPinned === true,
      createdAt: new Date().toISOString()
    };

    const created = await dbService.createCredit(newCredit);
    res.json({ success: true, credit: created, message: 'เพิ่มเครดิตสำเร็จเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error creating credit:', err);
    if (uploadedImages.length > 0) {
      await dbService.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกเครดิต: ' + err.message });
  }
});

// Update credit
app.put('/api/admin/credits/:id', requireAdmin, upload.array('images', MAX_FILES), async (req, res) => {
  let uploadedImages = [];
  try {
    const { title, game, price, customer, rating, date, description, isPinned, keepExistingImages } = req.body;
    const existing = await dbService.getCreditById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตที่ต้องการแก้ไข' });
    }

    let finalImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await processUploadedImages(req.files);
      if (keepExistingImages === 'true' || keepExistingImages === true) {
        finalImages = [...(existing.images || []), ...uploadedImages];
      } else {
        finalImages = uploadedImages;
      }
    } else {
      finalImages = existing.images || ['/images/placeholder-credit.svg'];
    }

    const updates = {
      title: title !== undefined ? title.trim().slice(0, 150) : existing.title,
      game: game !== undefined ? game.trim().slice(0, 50) : existing.game,
      price: price !== undefined ? Math.max(0, Math.min(1000000000, Number(price) || 0)) : existing.price,
      customer: customer !== undefined ? customer.trim().slice(0, 100) : existing.customer,
      rating: rating !== undefined ? Math.min(5, Math.max(1, Number(rating))) : existing.rating,
      date: date || existing.date,
      images: finalImages,
      description: description !== undefined ? description.trim().slice(0, 2000) : existing.description,
      isPinned: isPinned !== undefined ? (isPinned === 'true' || isPinned === true) : existing.isPinned
    };

    const updated = await dbService.updateCredit(req.params.id, updates);
    res.json({ success: true, credit: updated, message: 'อัปเดตข้อมูลเครดิตเรียบร้อย' });
  } catch (err) {
    console.error('Error updating credit:', err);
    if (uploadedImages.length > 0) {
      await dbService.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต: ' + err.message });
  }
});

// Delete credit
app.delete('/api/admin/credits/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await dbService.getCreditById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบเครดิตที่ต้องการลบ' });
    }
    await dbService.deleteCredit(req.params.id);
    res.json({ success: true, message: 'ลบรายการเครดิตเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Error deleting credit:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเครดิต' });
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
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการปักหมุด' });
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
    if (shopName) newSettings.shopName = shopName.trim().slice(0, 100);
    if (tagline !== undefined) newSettings.tagline = tagline.trim().slice(0, 200);
    if (announcement !== undefined) newSettings.announcement = announcement.trim().slice(0, 300);
    if (socials && typeof socials === 'object') newSettings.socials = { ...config.settings.socials, ...socials };
    if (stats && typeof stats === 'object') newSettings.stats = { ...config.settings.stats, ...stats };

    const updatedSettings = await dbService.updateShopSettings(newSettings);

    if (categories && Array.isArray(categories)) {
      const sanitizedCategories = categories.map(c => String(c).trim().slice(0, 50)).filter(Boolean);
      await dbService.updateCategories(sanitizedCategories);
    }

    res.json({ success: true, settings: updatedSettings, message: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).json({ success: false, message: 'บันทึกการตั้งค่าไม่สำเร็จ: ' + err.message });
  }
});

// Change admin PIN
app.post('/api/admin/change-pin', requireAdmin, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const config = await dbService.getShopConfig();
    const adminPin = (config.settings && config.settings.adminPin) ? config.settings.adminPin.toString() : '3645';

    if (!currentPin || currentPin.toString().trim() !== adminPin) {
      return res.status(400).json({ success: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' });
    }

    if (!newPin || newPin.toString().trim().length < 4 || newPin.toString().trim().length > 20) {
      return res.status(400).json({ success: false, message: 'PIN ใหม่ต้องมีความยาวระหว่าง 4 ถึง 20 ตัวอักษร' });
    }

    await dbService.updateShopSettings({ adminPin: newPin.toString().trim() });
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่าน / PIN แอดมินสำเร็จแล้ว' });
  } catch (err) {
    console.error('Change PIN error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยน PIN' });
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
app.post('/api/admin/import', requireAdmin, multer({ limits: { fileSize: 5 * 1024 * 1024 } }).single('backupFile'), async (req, res) => {
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
    console.error('Import error:', err);
    res.status(500).json({ success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ' });
  }
});

// ========================
// PAGE ROUTING & SEO
// ========================

// Dedicated Admin Web App route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://sunfz-credits.onrender.com/sitemap.xml\n`);
});

// Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const now = new Date().toISOString().split('T')[0];
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sunfz-credits.onrender.com/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// Fallback to index.html for customer storefront
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================
// GLOBAL ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
  console.error('Global Error:', err.message);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'ขนาดไฟล์รูปภาพเกินกำหนด (สูงสุด 5MB ต่อรูป)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: `จำนวนรูปภาพเกินกำหนด (สูงสุด ${MAX_FILES} รูป)` });
    }
    return res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง' });
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
