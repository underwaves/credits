import express from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import { loginLimiter } from '../middleware/rateLimit.js';
import { imageUpload, detectImageMime, MAX_FILES } from '../middleware/upload.js';
import {
  generateSessionToken,
  verifySessionToken,
  revokeToken,
  requireAdmin,
  timingSafeEqualString
} from '../middleware/security.js';
import { config } from '../config.js';
import * as db from '../services/db.js';

export const adminRouter = express.Router();

async function processUploadedImages(files) {
  if (!files || !files.length) return [];
  const uploadedUrls = [];
  const uploadedFileNames = [];

  try {
    for (const file of files) {
      const detected = detectImageMime(file.buffer);
      if (!detected) {
        throw new Error(`ไฟล์ "${file.originalname}" ไม่ใช่รูปภาพที่ถูกต้อง (รองรับ JPG, PNG, WebP)`);
      }
      const { url, fileName } = await db.uploadImage(file.buffer, detected.ext, detected.mime);
      uploadedUrls.push(url);
      uploadedFileNames.push(fileName);
    }
    return uploadedUrls;
  } catch (err) {
    if (uploadedFileNames.length > 0) {
      await db.deleteImagesFromStorage(uploadedFileNames);
    }
    throw err;
  }
}

// ---------------- Admin Auth ----------------
adminRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const { pin } = req.body;
    const shopCfg = await db.getShopConfig();
    const adminPin = (shopCfg.settings?.adminPin || config.adminPinFallback || '3645').toString();

    if (!pin || (typeof pin !== 'string' && typeof pin !== 'number')) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัส PIN' });
    }

    const inputPinStr = pin.toString().trim();
    if (!timingSafeEqualString(inputPinStr, adminPin)) {
      return res.status(401).json({ success: false, message: 'รหัสผ่าน / PIN แอดมินไม่ถูกต้อง' });
    }

    const token = generateSessionToken();
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: config.isProd
    });

    res.json({ success: true, token, message: 'เข้าสู่ระบบแอดมินสำเร็จ' });
  } catch (err) {
    console.error('[admin] Login error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

adminRouter.get('/check', (req, res) => {
  const token = req.cookies?.['admin_token'] || req.headers['x-admin-token'];
  if (token && verifySessionToken(token)) {
    return res.json({ success: true, isAdmin: true });
  }
  res.json({ success: false, isAdmin: false });
});

adminRouter.post('/logout', (req, res) => {
  const token = req.cookies?.['admin_token'] || req.headers['x-admin-token'];
  if (token) revokeToken(token);
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'ออกจากระบบเรียบร้อย' });
});

// ---------------- Credits Management ----------------
adminRouter.post('/credits', requireAdmin, imageUpload.array('images', MAX_FILES), async (req, res) => {
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

    const created = await db.createCredit(newCredit);
    res.json({ success: true, credit: created, message: 'เพิ่มเครดิตสำเร็จเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Create credit error:', err.message);
    if (uploadedImages.length > 0) {
      await db.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกเครดิต' });
  }
});

adminRouter.put('/credits/:id', requireAdmin, imageUpload.array('images', MAX_FILES), async (req, res) => {
  let uploadedImages = [];
  try {
    const { title, game, price, customer, rating, date, description, isPinned, keepExistingImages } = req.body;
    const existing = await db.getCreditById(req.params.id);

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

    const updated = await db.updateCredit(req.params.id, updates);
    res.json({ success: true, credit: updated, message: 'อัปเดตข้อมูลเครดิตเรียบร้อย' });
  } catch (err) {
    console.error('[admin] Update credit error:', err.message);
    if (uploadedImages.length > 0) {
      await db.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตเครดิต' });
  }
});

adminRouter.delete('/credits/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await db.getCreditById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบเครดิตที่ต้องการลบ' });
    }
    await db.deleteCredit(req.params.id);
    res.json({ success: true, message: 'ลบรายการเครดิตเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Delete credit error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบเครดิต' });
  }
});

adminRouter.put('/credits/:id/pin', requireAdmin, async (req, res) => {
  try {
    const newPinned = await db.togglePinCredit(req.params.id);
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

// ---------------- Review Management ----------------
adminRouter.delete('/reviews/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteCustomerReview(req.params.id);
    res.json({ success: true, message: 'ลบรายการรีวิวเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Delete review error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบรีวิว' });
  }
});

// ---------------- Settings & PIN ----------------
adminRouter.put('/settings', requireAdmin, async (req, res) => {
  try {
    const { shopName, tagline, announcement, socials, stats, categories } = req.body;
    const configData = await db.getShopConfig();

    const newSettings = {};
    if (shopName) newSettings.shopName = shopName.trim().slice(0, 100);
    if (tagline !== undefined) newSettings.tagline = tagline.trim().slice(0, 200);
    if (announcement !== undefined) newSettings.announcement = announcement.trim().slice(0, 300);
    if (socials && typeof socials === 'object') newSettings.socials = { ...configData.settings.socials, ...socials };
    if (stats && typeof stats === 'object') newSettings.stats = { ...configData.settings.stats, ...stats };

    const updatedSettings = await db.updateShopSettings(newSettings);

    if (categories && Array.isArray(categories)) {
      const sanitizedCategories = categories.map((c) => String(c).trim().slice(0, 50)).filter(Boolean);
      await db.updateCategories(sanitizedCategories);
    }

    res.json({ success: true, settings: updatedSettings, message: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Settings update error:', err.message);
    res.status(500).json({ success: false, message: 'บันทึกการตั้งค่าไม่สำเร็จ' });
  }
});

adminRouter.post('/change-pin', requireAdmin, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const configData = await db.getShopConfig();
    const adminPin = (configData.settings?.adminPin || config.adminPinFallback || '3645').toString();

    if (!currentPin || !timingSafeEqualString(currentPin.toString().trim(), adminPin)) {
      return res.status(400).json({ success: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' });
    }

    const cleanNewPin = newPin?.toString().trim();
    if (!cleanNewPin || cleanNewPin.length < 4 || cleanNewPin.length > 20) {
      return res.status(400).json({ success: false, message: 'PIN ใหม่ต้องมีความยาวระหว่าง 4 ถึง 20 ตัวอักษร' });
    }

    await db.updateShopSettings({ adminPin: cleanNewPin });
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่าน / PIN แอดมินสำเร็จแล้ว' });
  } catch (err) {
    console.error('[admin] Change PIN error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยน PIN' });
  }
});

// ---------------- Export & Import ----------------
adminRouter.get('/export', requireAdmin, async (req, res) => {
  try {
    const configData = await db.getShopConfig();
    const credits = await db.getCredits();
    const reviews = await db.getCustomerReviews();

    const backup = {
      settings: configData.settings,
      categories: configData.categories,
      credits,
      reviews,
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=sunfzenith-backup-${Date.now()}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: 'ไม่สามารถ Export ข้อมูลได้' });
  }
});

adminRouter.post(
  '/import',
  requireAdmin,
  multer({ limits: { fileSize: 5 * 1024 * 1024 } }).single('backupFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์สำรองข้อมูล JSON' });
      }
      const content = req.file.buffer.toString('utf8');
      const parsed = JSON.parse(content);
      if (!parsed.settings || !Array.isArray(parsed.credits)) {
        return res.status(400).json({ success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' });
      }

      await db.updateShopSettings(parsed.settings);
      if (parsed.categories) {
        await db.updateCategories(parsed.categories);
      }
      for (const c of parsed.credits) {
        const existing = await db.getCreditById(c.id);
        if (existing) {
          await db.updateCredit(c.id, c);
        } else {
          await db.createCredit(c);
        }
      }

      res.json({ success: true, message: 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('[admin] Import error:', err.message);
      res.status(500).json({ success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ' });
    }
  }
);
