// Isomorphic validation (browser + Node). Pure functions, no DOM, no Node APIs.
import { SERVICE_OPTIONS, BUDGET_OPTIONS, CONTACT_CHANNELS, LIMITS, ALLOWED_IMAGE_TYPES } from './options.js';

const SERVICE_IDS = new Set(SERVICE_OPTIONS.map((o) => o.id));
const BUDGET_IDS = new Set(BUDGET_OPTIONS.map((o) => o.id));
const CHANNEL_IDS = new Set(CONTACT_CHANNELS.map((o) => o.id));

// Control characters except tab/newline/carriage return.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trim, normalise, strip control chars. Non-strings become ''. */
export function cleanText(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  let s = value.normalize('NFC').replace(CONTROL_CHARS, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n') : s.replace(/\s+/g, ' ');
  return s.trim();
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const LINE_ID_RE = /^@?[A-Za-z0-9._-]{2,40}$/;

export function isValidEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

/** Thai mobile/landline: 0XXXXXXXX(X) or +66XXXXXXXX(X). Spaces/dashes allowed. */
export function isValidThaiPhone(v) {
  if (typeof v !== 'string') return false;
  const digits = v.replace(/[\s-]/g, '');
  return /^0\d{8,9}$/.test(digits) || /^\+66\d{8,9}$/.test(digits);
}

function validateContactValue(channel, value) {
  if (!value) return 'กรุณากรอกช่องทางติดต่อกลับ';
  if (value.length > LIMITS.contactMax) return `ยาวเกินไป (ไม่เกิน ${LIMITS.contactMax} ตัวอักษร)`;
  switch (channel) {
    case 'email':
      return isValidEmail(value) ? null : 'รูปแบบอีเมลไม่ถูกต้อง เช่น you@example.com';
    case 'phone':
      return isValidThaiPhone(value) ? null : 'เบอร์โทรไม่ถูกต้อง (เช่น 0898765432)';
    case 'line':
      return LINE_ID_RE.test(value) ? null : 'LINE ID ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด (2–40 ตัว)';
    case 'facebook':
      return value.length >= 2 ? null : 'กรุณากรอกชื่อหรือลิงก์ Facebook';
    default:
      return 'กรุณาเลือกช่องทางติดต่อ';
  }
}

/**
 * Validate a contact-form payload.
 * @returns {{ ok: boolean, data: object|null, errors: Record<string,string> }}
 */
export function validateContact(input = {}) {
  const src = input && typeof input === 'object' ? input : {};
  const data = {
    name: cleanText(src.name),
    contactChannel: cleanText(src.contactChannel),
    contactValue: cleanText(src.contactValue),
    service: cleanText(src.service),
    budget: cleanText(src.budget) || 'unsure',
    details: cleanText(src.details, { multiline: true })
  };
  const errors = {};

  if (!data.name) errors.name = 'กรุณากรอกชื่อของคุณ';
  else if (data.name.length < LIMITS.nameMin) errors.name = 'ชื่อสั้นเกินไป';
  else if (data.name.length > LIMITS.nameMax) errors.name = `ชื่อยาวเกินไป (ไม่เกิน ${LIMITS.nameMax} ตัวอักษร)`;

  if (!CHANNEL_IDS.has(data.contactChannel)) errors.contactChannel = 'กรุณาเลือกช่องทางติดต่อ';
  else {
    const msg = validateContactValue(data.contactChannel, data.contactValue);
    if (msg) errors.contactValue = msg;
  }

  if (!SERVICE_IDS.has(data.service)) errors.service = 'กรุณาเลือกประเภทบริการ';
  if (!BUDGET_IDS.has(data.budget)) errors.budget = 'กรุณาเลือกงบประมาณจากรายการ';

  if (!data.details) errors.details = 'กรุณาเล่ารายละเอียดงานสักนิด';
  else if (data.details.length < LIMITS.detailsMin) errors.details = `เล่าเพิ่มอีกนิดนะ (อย่างน้อย ${LIMITS.detailsMin} ตัวอักษร)`;
  else if (data.details.length > LIMITS.detailsMax) errors.details = `รายละเอียดยาวเกินไป (ไม่เกิน ${LIMITS.detailsMax} ตัวอักษร)`;

  const ok = Object.keys(errors).length === 0;
  return { ok, data: ok ? data : null, errors };
}

/** Anti-spam signals shared by client (to build payload) and server (to check it). */
export function checkSpamSignals({ website, elapsedMs } = {}) {
  if (typeof website === 'string' && website.trim() !== '') return 'honeypot';
  const ms = Number(elapsedMs);
  if (!Number.isFinite(ms) || ms < LIMITS.minFillMs) return 'too-fast';
  return null;
}

export function isValidIdempotencyKey(key) {
  return typeof key === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(key);
}

/**
 * Validate a +1 / -1 review (text part). Files are validated separately.
 */
export function validateReview(input = {}) {
  const type = input.type === '-1' ? '-1' : input.type === '+1' ? '+1' : null;
  const data = {
    type,
    customerName: cleanText(input.customerName).slice(0, LIMITS.reviewNameMax) || 'ลูกค้าทั่วไป',
    message: cleanText(input.message, { multiline: true })
  };
  const errors = {};
  if (!type) errors.type = 'กรุณาเลือกประเภทรีวิว (+1 หรือ -1)';
  if (data.message.length > LIMITS.reviewMessageMax) errors.message = `ข้อความยาวเกินไป (ไม่เกิน ${LIMITS.reviewMessageMax} ตัวอักษร)`;
  if (type === '-1' && data.message.length < LIMITS.reviewMinusMessageMin) {
    errors.message = 'การรายงาน -1 ต้องระบุปัญหาที่พบ (อย่างน้อย 5 ตัวอักษร)';
  }
  const ok = Object.keys(errors).length === 0;
  return { ok, data: ok ? data : null, errors };
}

/** Client-side file pre-check (server re-checks magic bytes). */
export function validateImageFiles(files) {
  const list = Array.from(files || []);
  if (list.length === 0) return 'กรุณาแนบรูปหลักฐานอย่างน้อย 1 รูป (สลิปหรือภาพแชท)';
  if (list.length > LIMITS.reviewMaxFiles) return `แนบรูปได้สูงสุด ${LIMITS.reviewMaxFiles} รูป`;
  for (const f of list) {
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) return `ไฟล์ "${f.name}" ไม่รองรับ (ใช้ JPG, PNG หรือ WebP)`;
    if (f.size > LIMITS.reviewMaxFileBytes) return `ไฟล์ "${f.name}" ใหญ่เกิน 5MB`;
  }
  return null;
}

/**
 * HTML entity escaping to prevent XSS and attribute breakout.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate and sanitize URLs for href and src attributes.
 * Allows only safe schemes: https: (and http: for dev/local), internal relative paths (/...),
 * and anchor identifiers (#...).
 * Strictly disallows javascript:, data:, vbscript:, file:, and protocol-relative URLs (//...).
 */
export function sanitizeUrl(rawUrl, fallback = '#') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  // Block control characters and unicode control ranges
  if (/[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) return fallback;

  // Safe internal anchor: #section
  if (trimmed.startsWith('#')) {
    return /^#[a-zA-Z0-9_\-\u0E00-\u0E7F]*$/.test(trimmed) ? trimmed : fallback;
  }

  // Safe relative paths: /path/to/page (strictly block protocol-relative //evil.com or /\)
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
    return trimmed;
  }

  // Parse absolute URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Validate and sanitize image URLs.
 */
export function sanitizeImageUrl(rawUrl, fallback = '/images/placeholder-credit.svg') {
  const safe = sanitizeUrl(rawUrl, fallback);
  return (safe === '#' || !safe) ? fallback : safe;
}
