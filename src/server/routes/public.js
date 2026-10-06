import express from 'express';
import { imageUpload, detectImageMime, MAX_FILES } from '../middleware/upload.js';
import { reviewLimiter, contactLimiter } from '../middleware/rateLimit.js';
import { validateContact, checkSpamSignals, validateReview, validateImageFiles } from '../../shared/validation.js';
import * as db from '../services/db.js';
import { notifyNewContact } from '../services/notifier.js';

export const publicRouter = express.Router();

// Helper to upload images with automatic rollback
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

// ---------------- Public Shop Settings ----------------
publicRouter.get('/settings', async (req, res) => {
  try {
    const config = await db.getShopConfig();
    const allCredits = await db.getCredits();

    const safeSettings = {
      shopName: config.settings.shopName,
      tagline: config.settings.tagline,
      announcement: config.settings.announcement,
      socials: config.settings.socials,
      stats: {
        ratingScore: config.settings.stats?.ratingScore || '5.0',
        totalOrders: config.settings.stats?.totalOrders || '100% คุณภาพ',
        deliveryRate: config.settings.stats?.deliveryRate || 'ส่งตรงเวลา',
        responseTime: config.settings.stats?.responseTime || 'ตอบไว',
        warrantyPeriod: config.settings.stats?.warrantyPeriod || 'มีประกัน',
        totalCredits: allCredits ? allCredits.length : 0
      }
    };

    res.json({
      success: true,
      settings: safeSettings,
      categories: config.categories || []
    });
  } catch (err) {
    console.error('[public] Settings error:', err.message);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดข้อมูลร้านค้าได้' });
  }
});

// ---------------- Credits ----------------
publicRouter.get('/credits', async (req, res) => {
  try {
    let { search, category, sort } = req.query;
    if (typeof search === 'string') search = search.slice(0, 100);
    if (typeof category === 'string') category = category.slice(0, 50);

    const credits = await db.getCredits({ search, category, sort });
    res.json({ success: true, credits });
  } catch (err) {
    console.error('[public] Credits error:', err.message);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรายการเครดิตได้' });
  }
});

publicRouter.get('/credits/:id', async (req, res) => {
  try {
    const id = req.params.id ? String(req.params.id).slice(0, 100) : '';
    const credit = await db.getCreditById(id);
    if (!credit) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการเครดิตนี้' });
    }
    res.json({ success: true, credit });
  } catch (err) {
    console.error('[public] Single credit error:', err.message);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการโหลดเครดิต' });
  }
});

// ---------------- Customer Reviews (+1 / -1) ----------------
publicRouter.get('/reviews', async (req, res) => {
  try {
    const reviews = await db.getCustomerReviews();
    const positiveCount = reviews.filter((r) => r.type === '+1').length;
    const negativeCount = reviews.filter((r) => r.type === '-1').length;

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
    console.error('[public] Reviews fetch error:', err.message);
    res.status(500).json({ success: false, message: 'ไม่สามารถโหลดรีวิวได้' });
  }
});

publicRouter.post('/reviews', reviewLimiter, imageUpload.array('images', MAX_FILES), async (req, res) => {
  let uploadedImages = [];
  try {
    const validation = validateReview(req.body);
    if (!validation.ok) {
      const firstError = Object.values(validation.errors)[0];
      return res.status(400).json({ success: false, message: firstError });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: validation.data.type === '+1'
          ? 'การให้เครดิต +1 จำเป็นต้องแนบหลักฐานการซื้อขาย (สลิปหรือภาพแชท) เพื่อยืนยันและป้องกันสแปม'
          : 'การให้เครดิต -1 จำเป็นต้องแนบรูปภาพหลักฐาน (สลิปหรือภาพแชท) เพื่อยืนยันความถูกต้อง'
      });
    }

    // Process & validate magic bytes
    uploadedImages = await processUploadedImages(req.files);

    const review = await db.createCustomerReview({
      type: validation.data.type,
      customerName: validation.data.customerName,
      message: validation.data.message,
      images: uploadedImages
    });

    res.json({
      success: true,
      review,
      message: validation.data.type === '+1'
        ? 'ส่งรีวิว +1 พร้อมหลักฐานเรียบร้อยแล้ว ขอบคุณสำหรับกำลังใจครับ!'
        : 'ส่งรายงาน -1 พร้อมหลักฐานเรียบร้อยแล้ว ทางร้านจะเร่งตรวจสอบครับ'
    });
  } catch (err) {
    console.error('[public] Review submission error:', err.message);
    if (uploadedImages.length > 0) {
      await db.deleteImagesFromStorage(uploadedImages);
    }
    res.status(400).json({
      success: false,
      message: err.message.includes('รูปภาพ') ? err.message : 'เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้ง'
    });
  }
});

// ---------------- Contact Form ----------------
publicRouter.post('/contact', contactLimiter, async (req, res) => {
  try {
    const { website, elapsedMs } = req.body;

    // Honeypot & timing checks
    const spamSignal = checkSpamSignals({ website, elapsedMs });
    if (spamSignal === 'honeypot') {
      // Silently accept honeypot hits without saving to deceive automated bots
      return res.json({ success: true, message: 'ส่งข้อความเรียบร้อยแล้ว' });
    }
    if (spamSignal === 'too-fast') {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกฟอร์มตามธรรมชาติ (ตรวจพบการส่งข้อมูลที่รวดเร็วเกินไป)'
      });
    }

    const validation = validateContact(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลในฟอร์ม',
        errors: validation.errors
      });
    }

    const saved = await db.saveContactMessage({
      ...validation.data,
      ip: req.ip || req.socket.remoteAddress
    });

    // Fire webhook asynchronously
    notifyNewContact(saved).catch(() => {});

    res.json({
      success: true,
      message: 'ส่งข้อความสำเร็จแล้ว! ทีมงาน SUNFZENITH จะติดต่อกลับโดยเร็วที่สุดครับ ✨'
    });
  } catch (err) {
    console.error('[public] Contact error:', err.message);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาติดต่อทาง LINE หรือ Facebook โดยตรง'
    });
  }
});
