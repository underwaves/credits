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

/**
 * Accept a manually supplied image URL only when it is safe to place in an
 * image src attribute. Uploaded files go through processUploadedImages()
 * instead, which also verifies their file signatures.
 */
function getSafeImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null;
  return sanitizeImageUrl(imageUrl.trim(), '');
}

/** Keep authentication material out of downloadable backups and imports. */
function withoutAuthenticationFields(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return null;
  const { adminPin, adminPinHash, ...safeSettings } = settings;
  return safeSettings;
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
      const safeImageUrl = getSafeImageUrl(req.body.imageUrl);
      if (!safeImageUrl) {
        return res.status(400).json({
          success: false,
          message: 'ลิงก์รูปภาพไม่ถูกต้อง กรุณาใช้ https:// หรือพาธรูปภาพภายในเว็บไซต์'
        });
      }
      uploadedImages = [safeImageUrl];
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
    let baseImages = [];
    if (req.body.remainingImages !== undefined) {
      try {
        const parsed = typeof req.body.remainingImages === 'string'
          ? JSON.parse(req.body.remainingImages)
          : req.body.remainingImages;
        if (Array.isArray(parsed)) {
          baseImages = parsed.filter(img => typeof img === 'string' && (existing.images || []).includes(img));
        }
      } catch {
        baseImages = existing.images || [];
      }
    } else if (keepExistingImages === 'true' || keepExistingImages === true) {
      baseImages = existing.images || [];
    }

    if (req.files && req.files.length > 0) {
      uploadedImages = await processUploadedImages(req.files);
      finalImages = [...baseImages, ...uploadedImages];
    } else {
      finalImages = req.body.remainingImages !== undefined
        ? baseImages
        : (existing.images || ['/images/placeholder-credit.svg']);
    }

    if (finalImages.length === 0) {
      finalImages = ['/images/placeholder-credit.svg'];
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
    if (!updated) {
      throw new Error('Failed to update credit record');
    }

    // Clean up images that were removed from this credit only after update succeeds
    const removedImages = (existing.images || []).filter(
      (img) => !finalImages.includes(img) && img !== '/images/placeholder-credit.svg'
    );
    if (removedImages.length > 0) {
      try {
        await db.deleteImagesFromStorage(removedImages);
      } catch (cleanupErr) {
        console.warn('[admin] Failed cleaning up removed credit images:', cleanupErr.message);
      }
    }

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
      // A backup is often stored outside the server. Never include a PIN or a
      // PIN hash in it, even though this endpoint itself requires an admin.
      settings: withoutAuthenticationFields(configData.settings),
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

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isValidSettingsSection(settings) {
  if (!isPlainObject(settings)) return false;
  if (settings.shopName !== undefined && (typeof settings.shopName !== 'string' || !settings.shopName.trim())) return false;
  if (settings.tagline !== undefined && typeof settings.tagline !== 'string') return false;
  if (settings.announcement !== undefined && typeof settings.announcement !== 'string') return false;
  if (settings.socials !== undefined) {
    if (!isPlainObject(settings.socials)) return false;
    for (const val of Object.values(settings.socials)) {
      if (!isPlainObject(val)) return false;
      if (val.url !== undefined && typeof val.url !== 'string') return false;
      if (val.label !== undefined && typeof val.label !== 'string') return false;
      if (val.enabled !== undefined && typeof val.enabled !== 'boolean') return false;
    }
  }
  if (settings.stats !== undefined && !isPlainObject(settings.stats)) return false;
  return true;
}

function isValidCategoriesSection(categories) {
  return (
    Array.isArray(categories) &&
    categories.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function isValidContentSection(content) {
  if (!isPlainObject(content)) return false;
  const hasKnownKey =
    content.general !== undefined ||
    content.socials !== undefined ||
    content.services !== undefined ||
    content.pricing !== undefined;
  if (!hasKnownKey) return false;

  if (content.general !== undefined) {
    if (!isPlainObject(content.general)) return false;
    for (const [key, val] of Object.entries(content.general)) {
      if (key === 'showAnnouncement') {
        if (typeof val !== 'boolean') return false;
      } else if (typeof val !== 'string') {
        return false;
      }
    }
  }
  if (content.socials !== undefined) {
    if (!isPlainObject(content.socials)) return false;
    for (const val of Object.values(content.socials)) {
      if (!isPlainObject(val)) return false;
      if (val.url !== undefined && typeof val.url !== 'string') return false;
      if (val.label !== undefined && typeof val.label !== 'string') return false;
      if (val.enabled !== undefined && typeof val.enabled !== 'boolean') return false;
    }
  }
  if (content.services !== undefined) {
    if (!Array.isArray(content.services)) return false;
    for (const item of content.services) {
      if (!isPlainObject(item)) return false;
      if (typeof item.title !== 'string' || !item.title.trim()) return false;
      if (item.id !== undefined && (typeof item.id !== 'string' || !item.id.trim())) return false;
      if (item.features !== undefined && (!Array.isArray(item.features) || !item.features.every((f) => typeof f === 'string'))) {
        return false;
      }
    }
  }
  if (content.pricing !== undefined) {
    if (!Array.isArray(content.pricing)) return false;
    for (const item of content.pricing) {
      if (!isPlainObject(item)) return false;
      if (typeof item.title !== 'string' || !item.title.trim()) return false;
      if (item.id !== undefined && (typeof item.id !== 'string' || !item.id.trim())) return false;
      if (item.features !== undefined && (!Array.isArray(item.features) || !item.features.every((f) => typeof f === 'string'))) {
        return false;
      }
    }
  }
  return true;
}

function isValidPortfolioSection(portfolio) {
  if (!Array.isArray(portfolio)) return false;
  return portfolio.every((item) => {
    if (!isPlainObject(item)) return false;
    if (typeof item.title !== 'string' || !item.title.trim()) return false;
    if (item.id !== undefined && (typeof item.id !== 'string' || !item.id.trim())) return false;
    if (item.category !== undefined && typeof item.category !== 'string') return false;
    if (item.categoryLabel !== undefined && typeof item.categoryLabel !== 'string') return false;
    if (item.desc !== undefined && typeof item.desc !== 'string') return false;
    if (
      item.tech !== undefined &&
      typeof item.tech !== 'string' &&
      (!Array.isArray(item.tech) || !item.tech.every((t) => typeof t === 'string'))
    ) {
      return false;
    }
    if (item.image !== undefined && typeof item.image !== 'string') return false;
    if (item.demoUrl !== undefined && typeof item.demoUrl !== 'string') return false;
    if (item.demoLabel !== undefined && typeof item.demoLabel !== 'string') return false;
    if (item.isReal !== undefined && typeof item.isReal !== 'boolean') return false;
    return true;
  });
}

function isValidCreditsSection(credits) {
  if (!Array.isArray(credits)) return false;
  return credits.every((item) => {
    if (!isPlainObject(item)) return false;
    if (typeof item.title !== 'string' || !item.title.trim()) return false;
    if (
      item.id !== undefined &&
      !(typeof item.id === 'string' && item.id.trim().length > 0) &&
      !(typeof item.id === 'number' && Number.isFinite(item.id))
    ) {
      return false;
    }
    if (item.game !== undefined && typeof item.game !== 'string') return false;
    if (item.price !== undefined) {
      const numericPrice = typeof item.price === 'number' ? item.price : (typeof item.price === 'string' && item.price.trim() !== '' ? Number(item.price) : NaN);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) return false;
    }
    if (item.customer !== undefined && typeof item.customer !== 'string') return false;
    if (item.rating !== undefined) {
      const numericRating = typeof item.rating === 'number' ? item.rating : (typeof item.rating === 'string' && item.rating.trim() !== '' ? Number(item.rating) : NaN);
      if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) return false;
    }
    if (item.date !== undefined && typeof item.date !== 'string') return false;
    if (item.images !== undefined && (!Array.isArray(item.images) || !item.images.every((img) => typeof img === 'string'))) {
      return false;
    }
    if (item.description !== undefined && typeof item.description !== 'string') return false;
    if (item.isPinned !== undefined && typeof item.isPinned !== 'boolean') return false;
    return true;
  });
}

function isValidReviewsSection(reviews) {
  if (!Array.isArray(reviews)) return false;
  return reviews.every((item) => {
    if (!isPlainObject(item)) return false;
    if (item.id !== undefined && (typeof item.id !== 'string' || !item.id.trim())) return false;
    if (item.type !== undefined && item.type !== '+1' && item.type !== '-1') return false;
    if (item.customerName !== undefined && typeof item.customerName !== 'string') return false;
    if (item.customer_name !== undefined && typeof item.customer_name !== 'string') return false;
    if (item.message !== undefined && typeof item.message !== 'string') return false;
    if (item.images !== undefined && (!Array.isArray(item.images) || !item.images.every((img) => typeof img === 'string'))) {
      return false;
    }
    return (
      item.type === '+1' ||
      item.type === '-1' ||
      typeof item.message === 'string' ||
      typeof item.customerName === 'string' ||
      typeof item.customer_name === 'string'
    );
  });
}

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
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(400).json({ success: false, message: 'ไฟล์สำรองข้อมูลไม่ใช่ JSON ที่ถูกต้อง' });
      }

      if (!isPlainObject(parsed)) {
        return res.status(400).json({ success: false, message: 'ไฟล์สำรองข้อมูลต้องเป็น JSON object' });
      }

      const hasKnownSection =
        parsed.settings !== undefined ||
        parsed.categories !== undefined ||
        parsed.content !== undefined ||
        parsed.portfolio !== undefined ||
        parsed.credits !== undefined ||
        parsed.reviews !== undefined;

      if (!hasKnownSection) {
        return res.status(400).json({ success: false, message: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง' });
      }

      // Validate ALL present backup sections upfront before writing any system state
      let safeSettings = null;
      if (parsed.settings !== undefined) {
        safeSettings = withoutAuthenticationFields(parsed.settings);
        if (!safeSettings || !isValidSettingsSection(safeSettings)) {
          return res.status(400).json({ success: false, message: 'ข้อมูลการตั้งค่าในไฟล์สำรองไม่ถูกต้อง' });
        }
      }
      if (parsed.categories !== undefined) {
        if (!isValidCategoriesSection(parsed.categories)) {
          return res.status(400).json({ success: false, message: 'หมวดหมู่ในไฟล์สำรองไม่ถูกต้อง' });
        }
      }
      if (parsed.content !== undefined) {
        if (!isValidContentSection(parsed.content)) {
          return res.status(400).json({ success: false, message: 'เนื้อหาเว็บไซต์ในไฟล์สำรองไม่ถูกต้อง' });
        }
      }
      if (parsed.portfolio !== undefined) {
        if (!isValidPortfolioSection(parsed.portfolio)) {
          return res.status(400).json({ success: false, message: 'รายการผลงานในไฟล์สำรองไม่ถูกต้อง' });
        }
      }
      if (parsed.credits !== undefined) {
        if (!isValidCreditsSection(parsed.credits)) {
          return res.status(400).json({ success: false, message: 'รายการเครดิตในไฟล์สำรองไม่ถูกต้อง' });
        }
      }
      if (parsed.reviews !== undefined) {
        if (!isValidReviewsSection(parsed.reviews)) {
          return res.status(400).json({ success: false, message: 'รายการรีวิวในไฟล์สำรองไม่ถูกต้อง' });
        }
      }

      // All sections validated; now apply writes
      if (safeSettings) {
        await db.updateShopSettings(safeSettings);
      }
      if (parsed.categories !== undefined) {
        await db.updateCategories(parsed.categories);
      }
      if (parsed.content !== undefined) {
        saveSiteContent(parsed.content);
      }
      if (parsed.portfolio !== undefined) {
        savePortfolioList(parsed.portfolio);
      }
      if (parsed.credits !== undefined) {
        for (const c of parsed.credits) {
          const existing = await db.getCreditById(c.id);
          if (existing) {
            await db.updateCredit(c.id, c);
          } else {
            await db.createCredit(c);
          }
        }
      }
      if (parsed.reviews !== undefined) {
        for (const r of parsed.reviews) {
          if (r.id) {
            await db.deleteCustomerReview(r.id);
          }
          await db.createCustomerReview({
            type: r.type === '-1' ? '-1' : '+1',
            customerName: r.customerName || r.customer_name || 'ลูกค้าทั่วไป',
            message: r.message || '',
            images: Array.isArray(r.images) ? r.images : []
          });
        }
      }

      res.json({ success: true, message: 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว' });
    } catch (err) {
      console.error('[admin] Import error:', err.message);
      res.status(500).json({ success: false, message: 'นำเข้าข้อมูลไม่สำเร็จ' });
    }
  }
);

