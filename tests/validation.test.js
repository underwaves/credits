import { describe, it, expect } from 'vitest';
import {
  cleanText,
  isValidEmail,
  isValidThaiPhone,
  validateContact,
  checkSpamSignals,
  isValidIdempotencyKey,
  validateReview,
  validateImageFiles
} from '../src/shared/validation.js';

describe('Shared Validation Utils', () => {
  describe('cleanText', () => {
    it('normalises text and trims extra whitespace', () => {
      expect(cleanText('   Hello    World   ')).toBe('Hello World');
      expect(cleanText('ทดสอบ    ภาษาไทย   ')).toBe('ทดสอบ ภาษาไทย');
    });

    it('handles control characters safely', () => {
      expect(cleanText('Hello\u0000World')).toBe('HelloWorld');
    });

    it('handles multiline preservation', () => {
      const input = 'Line 1\n\n\n\n\nLine 2';
      expect(cleanText(input, { multiline: true })).toBe('Line 1\n\n\nLine 2');
    });
  });

  describe('Contact Validators', () => {
    it('validates emails correctly', () => {
      expect(isValidEmail('test@sunfzenith.com')).toBe(true);
      expect(isValidEmail('hello.world@sub.domain.co')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('bad@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('validates Thai phone numbers', () => {
      expect(isValidThaiPhone('0812345678')).toBe(true);
      expect(isValidThaiPhone('099-123-4567')).toBe(true);
      expect(isValidThaiPhone('+66812345678')).toBe(true);
      expect(isValidThaiPhone('12345')).toBe(false);
      expect(isValidThaiPhone('abcdefghij')).toBe(false);
    });

    it('validates a complete valid contact form', () => {
      const validPayload = {
        name: 'สมชาย นักพัฒนา',
        contactChannel: 'line',
        contactValue: 'somchai_dev',
        service: 'website',
        budget: '1000-3000',
        details: 'ต้องการทำหน้า Landing Page สำหรับร้านค้าออนไลน์ สไตล์น่ารักอบอุ่น'
      };

      const result = validateContact(validPayload);
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.data.name).toBe('สมชาย นักพัฒนา');
      expect(result.data.contactValue).toBe('somchai_dev');
    });

    it('fails when required fields are missing or invalid', () => {
      const invalidPayload = {
        name: '',
        contactChannel: 'email',
        contactValue: 'invalid-email',
        service: 'invalid-service',
        budget: 'invalid-budget',
        details: 'สั้น'
      };

      const result = validateContact(invalidPayload);
      expect(result.ok).toBe(false);
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.contactValue).toBeTruthy();
      expect(result.errors.service).toBeTruthy();
      expect(result.errors.details).toBeTruthy();
    });
  });

  describe('Spam Signals', () => {
    it('catches honeypot spam', () => {
      expect(checkSpamSignals({ website: 'http://spam.com', elapsedMs: 5000 })).toBe('honeypot');
    });

    it('catches too-fast submissions', () => {
      expect(checkSpamSignals({ website: '', elapsedMs: 500 })).toBe('too-fast');
    });

    it('passes human submission timing', () => {
      expect(checkSpamSignals({ website: '', elapsedMs: 4000 })).toBeNull();
    });
  });

  describe('Review Validation', () => {
    it('validates +1 review with optional message', () => {
      const res = validateReview({
        type: '+1',
        customerName: 'คุณดาว',
        message: 'งานดีมาก ประทับใจสุดๆ'
      });
      expect(res.ok).toBe(true);
      expect(res.data.type).toBe('+1');
      expect(res.data.customerName).toBe('คุณดาว');
    });

    it('requires explanation for -1 review', () => {
      const emptyMinus = validateReview({
        type: '-1',
        customerName: 'Anonymous',
        message: ''
      });
      expect(emptyMinus.ok).toBe(false);
      expect(emptyMinus.errors.message).toBeTruthy();

      const validMinus = validateReview({
        type: '-1',
        customerName: 'Anonymous',
        message: 'พบปัญหาการส่งมอบงานล่าช้ากว่ากำหนด'
      });
      expect(validMinus.ok).toBe(true);
    });

    it('checks image files count and types', () => {
      expect(validateImageFiles([])).toBeTruthy(); // Requires at least 1 image
      expect(
        validateImageFiles([
          { name: 'slip.jpg', type: 'image/jpeg', size: 1024 * 100 }
        ])
      ).toBeNull();
      expect(
        validateImageFiles([
          { name: 'doc.pdf', type: 'application/pdf', size: 1024 * 100 }
        ])
      ).toBeTruthy();
    });
  });
});
