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
  timingSafeEqualString,
  hashPin,
  verifyPin
} from '../middleware/security.js';
import { sanitizeUrl, sanitizeImageUrl } from '../../shared/validation.js';
import { config } from '../config.js';
import * as db from '../services/db.js';
import {
  getAllPortfolio,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  savePortfolioList
} from '../services/portfolioDb.js';
import {
  getSiteContent,
  saveSiteContent,
  updateGeneralContent,
  updateSocialsContent,
  createService,
  updateService,
  deleteService,
  createPricing,
  updatePricing,
  deletePricing
} from '../services/contentDb.js';

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
    if (!pin || (typeof pin !== 'string' && typeof pin !== 'number')) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกรหัส PIN' });
    }

    const shopCfg = await db.getShopConfig();
    const storedHash = shopCfg.settings?.adminPinHash || (config.adminPinFallback ? config.adminPinFallback : null);

    if (!storedHash) {
      return res.status(401).json({
        success: false,
        message: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่านแอดมิน (กรุณาตั้งค่า ADMIN_PIN ในระบบก่อนเข้าสู่ระบบ)'
      });
    }

    const inputPinStr = pin.toString().trim();
    if (!verifyPin(inputPinStr, storedHash)) {
      return res.status(401).json({ success: false, message: 'รหัสผ่าน / PIN แอดมินไม่ถูกต้อง' });
    }

    const token = generateSessionToken();
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: config.isProd,
      path: '/'
    });

    res.json({
      success: true,
      shopSlug: 'sunfz',
      shopName: shopCfg.settings?.shopName || 'SUNFZ',
      message: 'เข้าสู่ระบบแอดมินสำเร็จ'
    });
  } catch (err) {
    console.error('[admin] Login error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

adminRouter.get('/check', async (req, res) => {
  const token = req.cookies?.['admin_token'];
  if (token && verifySessionToken(token)) {
    const shopCfg = await db.getShopConfig();
    return res.json({
      success: true,
      isAdmin: true,
      shopSlug: 'sunfz',
      shopName: shopCfg.settings?.shopName || 'SUNFZ'
    });
  }
  res.json({ success: false, isAdmin: false });
});

adminRouter.post('/logout', (req, res) => {
  const token = req.cookies?.['admin_token'];
  if (token) revokeToken(token);
  res.clearCookie('admin_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/'
  });
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

// ---------------- Settings ----------------
adminRouter.put('/settings', requireAdmin, async (req, res) => {
  try {
    const { shopName, tagline, announcement, socials, stats, categories } = req.body;
    const configData = await db.getShopConfig();

    const newSettings = {};
    if (shopName) newSettings.shopName = shopName.trim().slice(0, 100);
    if (tagline !== undefined) newSettings.tagline = tagline.trim().slice(0, 200);
    if (announcement !== undefined) newSettings.announcement = announcement.trim().slice(0, 300);

    if (socials && typeof socials === 'object') {
      const sanitizedSocials = { ...configData.settings.socials };
      for (const [key, val] of Object.entries(socials)) {
        if (val && typeof val === 'object') {
          sanitizedSocials[key] = {
            ...sanitizedSocials[key],
            ...val,
            url: val.url !== undefined ? (val.url ? sanitizeUrl(String(val.url).trim(), '') : '') : sanitizedSocials[key]?.url
          };
        }
      }
      newSettings.socials = sanitizedSocials;
    }

    if (stats && typeof stats === 'object') newSettings.stats = { ...configData.settings.stats, ...stats };

    const updatedSettings = await db.updateShopSettings(newSettings);

    if (categories && Array.isArray(categories)) {
      const sanitizedCategories = categories.map((c) => String(c).trim().slice(0, 50)).filter(Boolean);
      await db.updateCategories(sanitizedCategories);
    }

    const { adminPin, adminPinHash, ...safeSettings } = updatedSettings;
    res.json({ success: true, settings: safeSettings, message: 'บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Settings update error:', err.message);
    res.status(500).json({ success: false, message: 'บันทึกการตั้งค่าไม่สำเร็จ' });
  }
});

// ---------------- Portfolio Management ----------------
adminRouter.get('/portfolio', requireAdmin, (req, res) => {
  try {
    const portfolio = getAllPortfolio();
    res.json({ success: true, portfolio });
  } catch (err) {
    console.error('[admin] Fetch portfolio error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดรายการผลงาน' });
  }
});

adminRouter.post('/portfolio', requireAdmin, imageUpload.single('image'), async (req, res) => {
  let uploadedFile = null;
  try {
    const {
      title,
      category,
      categoryLabel,
      desc,
      tech,
      imageUrl,
      demoUrl,
      demoLabel,
      isReal
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผลงาน' });
    }

    let finalImageUrl = imageUrl ? imageUrl.trim() : '';

    if (req.file) {
      const detected = detectImageMime(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          success: false,
          message: `ไฟล์ "${req.file.originalname}" ไม่ใช่รูปภาพที่ถูกต้อง (รองรับ JPG, PNG, WebP)`
        });
      }
      const uploaded = await db.uploadImage(req.file.buffer, detected.ext, detected.mime);
      uploadedFile = uploaded.fileName;
      finalImageUrl = uploaded.url;
    }

    if (!finalImageUrl) {
      finalImageUrl = '/images/placeholder-credit.svg';
    }

    const cat = (category || 'design').trim();
    let catLabel = categoryLabel?.trim();
    if (!catLabel) {
      const labelMap = {
        website: 'Web Application',
        coding: 'Coding & Backend',
        design: 'Graphic & Design',
        presentation: 'Slide Deck & Presentation'
      };
      catLabel = labelMap[cat] || 'ผลงานสร้างสรรค์';
    }

    let finalDemoLabel = demoLabel?.trim();
    if (!finalDemoLabel) {
      finalDemoLabel = (cat === 'website' || (demoUrl && demoUrl.startsWith('http') && !demoUrl.includes('image')))
        ? 'เข้าชมโปรเจกต์'
        : 'ดูภาพผลงานเต็ม';
    }

    const safeImage = sanitizeImageUrl(finalImageUrl);
    const safeDemo = demoUrl ? sanitizeUrl(demoUrl.trim(), safeImage) : safeImage;

    const newItem = createPortfolio({
      title: title.trim(),
      category: cat,
      categoryLabel: catLabel,
      desc: desc ? desc.trim() : '',
      tech: tech || '',
      image: safeImage,
      demoUrl: safeDemo,
      demoLabel: finalDemoLabel,
      isReal: isReal !== 'false' && isReal !== false
    });

    res.json({
      success: true,
      portfolio: newItem,
      message: 'เพิ่มผลงานสำเร็จเรียบร้อยแล้ว ✨'
    });
  } catch (err) {
    console.error('[admin] Create portfolio error:', err.message);
    if (uploadedFile) {
      await db.deleteImagesFromStorage([uploadedFile]);
    }
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มผลงาน: ' + err.message });
  }
});

adminRouter.put('/portfolio/:id', requireAdmin, imageUpload.single('image'), async (req, res) => {
  let uploadedFile = null;
  try {
    const id = req.params.id;
    const existing = getPortfolioById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการผลงานนี้' });
    }

    const {
      title,
      category,
      categoryLabel,
      desc,
      tech,
      imageUrl,
      demoUrl,
      demoLabel,
      isReal
    } = req.body;

    let finalImageUrl = existing.image;
    if (imageUrl && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim();
    }

    if (req.file) {
      const detected = detectImageMime(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          success: false,
          message: `ไฟล์ "${req.file.originalname}" ไม่ใช่รูปภาพที่ถูกต้อง (รองรับ JPG, PNG, WebP)`
        });
      }
      const uploaded = await db.uploadImage(req.file.buffer, detected.ext, detected.mime);
      uploadedFile = uploaded.fileName;
      finalImageUrl = uploaded.url;
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (category !== undefined) updates.category = category.trim();
    if (categoryLabel !== undefined) updates.categoryLabel = categoryLabel.trim();
    if (desc !== undefined) updates.desc = desc.trim();
    if (tech !== undefined) updates.tech = tech;
    if (finalImageUrl) updates.image = sanitizeImageUrl(finalImageUrl);
    if (demoUrl !== undefined) updates.demoUrl = sanitizeUrl(demoUrl.trim(), updates.image || existing.image);
    if (demoLabel !== undefined) updates.demoLabel = demoLabel.trim();
    if (isReal !== undefined) updates.isReal = isReal !== 'false' && isReal !== false;

    const updated = updatePortfolio(id, updates);
    res.json({
      success: true,
      portfolio: updated,
      message: 'อัปเดตผลงานเรียบร้อยแล้ว ✨'
    });
  } catch (err) {
    console.error('[admin] Update portfolio error:', err.message);
    if (uploadedFile) {
      await db.deleteImagesFromStorage([uploadedFile]);
    }
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขผลงาน: ' + err.message });
  }
});

adminRouter.delete('/portfolio/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const existing = getPortfolioById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการผลงานนี้' });
    }

    if (existing.image && (existing.image.startsWith('/images/uploads/') || existing.image.includes('supabase'))) {
      await db.deleteImagesFromStorage([existing.image]);
    }

    const deleted = deletePortfolio(id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: 'ลบผลงานไม่สำเร็จ' });
    }

    res.json({ success: true, message: 'ลบผลงานเรียบร้อยแล้ว' });
  } catch (err) {
    console.error('[admin] Delete portfolio error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบผลงาน' });
  }
});

// ---------------- Site Content Management (Full CMS) ----------------
adminRouter.get('/content', requireAdmin, (req, res) => {
  try {
    const content = getSiteContent();
    res.json({ success: true, content });
  } catch (err) {
    console.error('[admin] Fetch content error:', err.message);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลเนื้อหาได้' });
  }
});

adminRouter.put('/content/general', requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const updated = updateGeneralContent(updates);

    const shopSettingsSync = {};
    if (updates.shopName) shopSettingsSync.shopName = updates.shopName;
    if (updates.tagline) shopSettingsSync.tagline = updates.tagline;
    if (updates.announcement) shopSettingsSync.announcement = updates.announcement;
    if (Object.keys(shopSettingsSync).length > 0) {
      await db.updateShopSettings(shopSettingsSync);
    }

    res.json({
      success: true,
      general: updated,
      message: 'บันทึกข้อมูลทั่วไปและส่วนหัวเว็บสำเร็จเรียบร้อยแล้ว ✨'
    });
  } catch (err) {
    console.error('[admin] Update general content error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});

adminRouter.put('/content/socials', requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const updated = updateSocialsContent(updates);
    await db.updateShopSettings({ socials: updated });

    res.json({
      success: true,
      socials: updated,
      message: 'บันทึกช่องทางติดต่อและโซเชียลมีเดียเรียบร้อยแล้ว ✨'
    });
  } catch (err) {
    console.error('[admin] Update socials error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกช่องทางติดต่อ' });
  }
});

// Services CRUD
adminRouter.post('/services', requireAdmin, (req, res) => {
  try {
    const { title, icon, badge, startingPrice, desc, features } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อบริการ' });
    }
    const newService = createService({ title, icon, badge, startingPrice, desc, features });
    res.json({ success: true, service: newService, message: 'เพิ่มบริการใหม่เรียบร้อยแล้ว ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มบริการ' });
  }
});

adminRouter.put('/services/:id', requireAdmin, (req, res) => {
  try {
    const updated = updateService(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'ไม่พบบริการนี้' });
    res.json({ success: true, service: updated, message: 'อัปเดตบริการเรียบร้อยแล้ว ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขบริการ' });
  }
});

adminRouter.delete('/services/:id', requireAdmin, (req, res) => {
  try {
    const deleted = deleteService(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'ไม่พบบริการนี้' });
    res.json({ success: true, message: 'ลบบริการเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบบริการ' });
  }
});

// Pricing CRUD
adminRouter.post('/pricing', requireAdmin, (req, res) => {
  try {
    const { title, price, badge, desc, isHighlight, features, actionText, actionUrl } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อแพ็กเกจราคา' });
    }
    const safeActionUrl = actionUrl ? sanitizeUrl(actionUrl.trim(), '#contact') : '#contact';
    const newPricing = createPricing({ title, price, badge, desc, isHighlight, features, actionText, actionUrl: safeActionUrl });
    res.json({ success: true, pricing: newPricing, message: 'เพิ่มแพ็กเกจราคาใหม่เรียบร้อยแล้ว ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มแพ็กเกจ' });
  }
});

adminRouter.put('/pricing/:id', requireAdmin, (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.actionUrl !== undefined) {
      payload.actionUrl = sanitizeUrl(String(payload.actionUrl).trim(), '#contact');
    }
    const updated = updatePricing(req.params.id, payload);
    if (!updated) return res.status(404).json({ success: false, message: 'ไม่พบแพ็กเกจนี้' });
    res.json({ success: true, pricing: updated, message: 'อัปเดตแพ็กเกจราคาเรียบร้อยแล้ว ✨' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขแพ็กเกจ' });
  }
});

adminRouter.delete('/pricing/:id', requireAdmin, (req, res) => {
  try {
    const deleted = deletePricing(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'ไม่พบแพ็กเกจนี้' });
    res.json({ success: true, message: 'ลบแพ็กเกจราคาเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบแพ็กเกจ' });
  }
});

adminRouter.post('/change-pin', requireAdmin, async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const configData = await db.getShopConfig();
    const storedHash = configData.settings?.adminPinHash || (config.adminPinFallback ? config.adminPinFallback : null);

    if (!storedHash) {
      return res.status(400).json({ success: false, message: 'ไม่พบข้อมูล PIN เดิมในระบบ' });
    }

    if (!currentPin || !verifyPin(String(currentPin).trim(), storedHash)) {
      return res.status(400).json({ success: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' });
    }

    const cleanNewPin = newPin?.toString().trim();
    if (!cleanNewPin || cleanNewPin.length < 6 || cleanNewPin.length > 64) {
      return res.status(400).json({ success: false, message: 'PIN ใหม่ต้องมีความยาวระหว่าง 6 ถึง 64 ตัวอักษร' });
    }

    if (['1234', '123456', '3645', '0000', '1111', '000000', 'password'].includes(cleanNewPin)) {
      return res.status(400).json({ success: false, message: 'PIN ใหม่มีความปลอดภัยต่ำเกินไป กรุณาใช้รหัสที่คาดเดายากขึ้น' });
    }

    const hashed = hashPin(cleanNewPin);
    await db.updateShopSettings({ adminPinHash: hashed });
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
    const content = getSiteContent();
    const portfolio = getAllPortfolio();

    const backup = {
      settings: configData.settings,
      categories: configData.categories,
      content,
      portfolio,
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
      const raw = req.file.buffer.toString('utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.settings && !parsed.content && !Array.isArray(parsed.credits)) {
        return res.status(400).json({ success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' });
      }

      if (parsed.settings) {
        await db.updateShopSettings(parsed.settings);
      }
      if (parsed.categories) {
        await db.updateCategories(parsed.categories);
      }
      if (parsed.content) {
        saveSiteContent(parsed.content);
      }
      if (Array.isArray(parsed.portfolio)) {
        savePortfolioList(parsed.portfolio);
      }
      if (Array.isArray(parsed.credits)) {
        for (const c of parsed.credits) {
          const existing = await db.getCreditById(c.id);
          if (existing) {
            await db.updateCredit(c.id, c);
          } else {
            await db.createCredit(c);
          }
        }
      }

      res.json({ success: true, message: 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('[admin] Import error:', err.message);
      res.status(500).json({ success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ' });
    }
  }
);
