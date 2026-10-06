import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/app.js';

describe('Server & Endpoints', () => {
  const app = createApp();

  describe('Static & Pages Routing', () => {
    it('GET / returns 200 with HTML brand studio page', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('SUNFZENITH');
      expect(res.text).toContain('Small Dream, Big Zenith');
    });

    it('GET /?credit=abc redirects 301 to /credits?credit=abc', async () => {
      const res = await request(app).get('/?credit=abc');
      expect(res.status).toBe(301);
      expect(res.headers.location).toBe('/credits?credit=abc');
    });

    it('GET /credits returns 200 with HTML credits page', async () => {
      const res = await request(app).get('/credits');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('สมุดรวมเครดิต');
    });

    it('GET /admin returns 200 with HTML admin studio page', async () => {
      const res = await request(app).get('/admin');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Admin');
    });

    it('GET /random-non-existent-path returns 404 with custom 404 HTML', async () => {
      const res = await request(app).get('/random-non-existent-path');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('404');
    });

    it('GET /api/non-existent returns 404 JSON', async () => {
      const res = await request(app).get('/api/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Endpoint not found');
    });
  });

  describe('SEO & Manifest', () => {
    it('GET /robots.txt returns valid text', async () => {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(200);
      expect(res.text).toContain('User-agent');
    });

    it('GET /sitemap.xml returns valid xml', async () => {
      const res = await request(app).get('/sitemap.xml');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('xml');
    });
  });

  describe('Security Headers', () => {
    it('includes security headers in responses', async () => {
      const res = await request(app).get('/');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeTruthy();
    });
  });

  describe('Public API', () => {
    it('GET /api/public/settings returns shop settings', async () => {
      const res = await request(app).get('/api/public/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.shopName).toBe('SUNFZENITH');
    });

    it('POST /api/public/contact rejects spam honeypot', async () => {
      const res = await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Spam Bot',
          contactChannel: 'email',
          contactValue: 'spam@bot.com',
          service: 'web-landing',
          budget: '5k-15k',
          details: 'Spamming content here please buy',
          website: 'http://malicious.link',
          elapsedMs: 5000
        });

      // Honeypot returns success: true silently to misdirect bots without storing
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/public/contact rejects too-fast submission', async () => {
      const res = await request(app)
        .post('/api/public/contact')
        .send({
          name: 'Fast Bot',
          contactChannel: 'email',
          contactValue: 'fast@bot.com',
          service: 'web-landing',
          budget: '5k-15k',
          details: 'Too fast submission test',
          elapsedMs: 200
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('รวดเร็ว');
    });

    it('POST /api/public/contact validates missing fields properly', async () => {
      const res = await request(app)
        .post('/api/public/contact')
        .send({
          name: '',
          contactChannel: 'line',
          contactValue: '',
          service: 'invalid',
          budget: 'invalid',
          details: '',
          elapsedMs: 5000
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('Admin Auth', () => {
    it('POST /api/admin/login fails with wrong PIN', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ pin: '0000' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ไม่ถูกต้อง');
    });

    it('POST /api/admin/login succeeds with correct PIN 3645', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ pin: '3645' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });
});
