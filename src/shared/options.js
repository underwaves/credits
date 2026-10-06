// Shared, isomorphic constants for the contact form and review form.
// Imported by the browser bundle AND the Express server so both validate identically.

export const SERVICE_OPTIONS = Object.freeze([
  { id: 'website', label: 'Website / Web App' },
  { id: 'coding', label: 'Coding / Programming' },
  { id: 'design', label: 'Graphic / Design' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'other', label: 'อื่น ๆ / ยังไม่แน่ใจ' }
]);

export const BUDGET_OPTIONS = Object.freeze([
  { id: 'unsure', label: 'ยังไม่แน่ใจ / ให้ช่วยประเมิน' },
  { id: 'lt1000', label: 'ไม่เกิน 1,000 บาท' },
  { id: '1000-3000', label: '1,000 – 3,000 บาท' },
  { id: '3000-8000', label: '3,000 – 8,000 บาท' },
  { id: 'gt8000', label: 'มากกว่า 8,000 บาท' }
]);

export const CONTACT_CHANNELS = Object.freeze([
  { id: 'line', label: 'LINE ID', placeholder: 'เช่น sunny.dream' },
  { id: 'facebook', label: 'Facebook', placeholder: 'ชื่อเฟซบุ๊กหรือลิงก์โปรไฟล์' },
  { id: 'email', label: 'อีเมล', placeholder: 'you@example.com' },
  { id: 'phone', label: 'เบอร์โทร', placeholder: '08x-xxx-xxxx' }
]);

export const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 80,
  contactMax: 120,
  detailsMin: 20,
  detailsMax: 2000,
  minFillMs: 2500,
  reviewNameMax: 60,
  reviewMessageMax: 1000,
  reviewMinusMessageMin: 5,
  reviewMaxFiles: 5,
  reviewMaxFileBytes: 5 * 1024 * 1024
});

export const ALLOWED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
