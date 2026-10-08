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

  describe('Portfolio API', () => {
    it('GET /api/public/portfolio returns list of portfolio items', async () => {
      const res = await request(app).get('/api/public/portfolio');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.portfolio)).toBe(true);
      expect(res.body.portfolio.length).toBeGreaterThanOrEqual(11);
      const first = res.body.portfolio[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('category');
    });

    it('Admin portfolio endpoints require authorization', async () => {
      const getRes = await request(app).get('/api/admin/portfolio');
      expect(getRes.status).toBe(401);

      const postRes = await request(app).post('/api/admin/portfolio').send({ title: 'Test' });
      expect(postRes.status).toBe(401);
    });

    it('Admin can CRUD portfolio items', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/admin/login')
        .send({ pin: '3645' });
      expect(loginRes.status).toBe(200);
      const cookie = loginRes.headers['set-cookie'];

      // 2. GET /api/admin/portfolio
      const listRes = await request(app)
        .get('/api/admin/portfolio')
        .set('Cookie', cookie);
      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);

      // 3. POST /api/admin/portfolio
      const createRes = await request(app)
        .post('/api/admin/portfolio')
        .set('Cookie', cookie)
        .field('title', 'Automated Test Poster')
        .field('category', 'design')
        .field('desc', 'Poster created during automated integration tests')
        .field('tech', 'Photoshop, Illustrator')
        .field('imageUrl', 'https://example.com/test-poster.jpg')
        .field('isReal', 'true');
      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      const createdItem = createRes.body.portfolio;
      expect(createdItem.title).toBe('Automated Test Poster');
      expect(createdItem.id).toBeDefined();

      // 4. PUT /api/admin/portfolio/:id
      const updateRes = await request(app)
        .put(`/api/admin/portfolio/${createdItem.id}`)
        .set('Cookie', cookie)
        .field('title', 'Updated Test Poster')
        .field('desc', 'Updated description');
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.portfolio.title).toBe('Updated Test Poster');

      // 5. DELETE /api/admin/portfolio/:id
      const deleteRes = await request(app)
        .delete(`/api/admin/portfolio/${createdItem.id}`)
        .set('Cookie', cookie);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it('CMS Content, Services & Pricing CRUD workflow', async () => {
      // Login
      const loginRes = await request(app)
        .post('/api/admin/login')
        .send({ pin: '3645' });
      const cookie = loginRes.headers['set-cookie'];

      // 1. GET /api/public/content
      const publicContentRes = await request(app).get('/api/public/content');
      expect(publicContentRes.status).toBe(200);
      expect(publicContentRes.body.success).toBe(true);
      expect(publicContentRes.body.content.general).toBeDefined();
      expect(publicContentRes.body.content.services).toBeDefined();
      expect(publicContentRes.body.content.pricing).toBeDefined();

      // 2. GET /api/admin/content
      const adminContentRes = await request(app)
        .get('/api/admin/content')
        .set('Cookie', cookie);
      expect(adminContentRes.status).toBe(200);
      expect(adminContentRes.body.success).toBe(true);
      expect(adminContentRes.body.content).toBeDefined();

      // 3. PUT /api/admin/content/general
      const updateGenRes = await request(app)
        .put('/api/admin/content/general')
        .set('Cookie', cookie)
        .send({ tagline: 'Automated Test Tagline' });
      expect(updateGenRes.status).toBe(200);
      expect(updateGenRes.body.success).toBe(true);
      expect(updateGenRes.body.general.tagline).toBe('Automated Test Tagline');

      // 4. PUT /api/admin/content/socials
      const updateSocRes = await request(app)
        .put('/api/admin/content/socials')
        .set('Cookie', cookie)
        .send({ discord: { url: 'https://discord.gg/test', label: 'Test Discord', enabled: true } });
      expect(updateSocRes.status).toBe(200);
      expect(updateSocRes.body.success).toBe(true);
      expect(updateSocRes.body.socials.discord.enabled).toBe(true);

      // 5. Services CRUD
      const createServiceRes = await request(app)
        .post('/api/admin/services')
        .set('Cookie', cookie)
        .send({
          title: 'Test Service',
          icon: '🚀',
          badge: 'New',
          startingPrice: '99 ฿',
          desc: 'Test description',
          features: ['Feature 1', 'Feature 2']
        });
      expect(createServiceRes.status).toBe(200);
      expect(createServiceRes.body.success).toBe(true);
      const testService = createServiceRes.body.service;
      expect(testService.id).toBeDefined();

      const updateServiceRes = await request(app)
        .put(`/api/admin/services/${testService.id}`)
        .set('Cookie', cookie)
        .send({ title: 'Updated Test Service' });
      expect(updateServiceRes.status).toBe(200);
      expect(updateServiceRes.body.service.title).toBe('Updated Test Service');

      const delServiceRes = await request(app)
        .delete(`/api/admin/services/${testService.id}`)
        .set('Cookie', cookie);
      expect(delServiceRes.status).toBe(200);
      expect(delServiceRes.body.success).toBe(true);

      // 6. Pricing CRUD
      const createPricingRes = await request(app)
        .post('/api/admin/pricing')
        .set('Cookie', cookie)
        .send({
          title: 'Test Package',
          price: '299 ฿',
          badge: 'Popular',
          desc: 'Package description',
          isHighlight: true,
          features: ['Benefit 1'],
          actionText: 'Order Now',
          actionUrl: '#contact'
        });
      expect(createPricingRes.status).toBe(200);
      expect(createPricingRes.body.success).toBe(true);
      const testPricing = createPricingRes.body.pricing;
      expect(testPricing.id).toBeDefined();

      const updatePricingRes = await request(app)
        .put(`/api/admin/pricing/${testPricing.id}`)
        .set('Cookie', cookie)
        .send({ title: 'Updated Test Package' });
      expect(updatePricingRes.status).toBe(200);
      expect(updatePricingRes.body.pricing.title).toBe('Updated Test Package');

      const delPricingRes = await request(app)
        .delete(`/api/admin/pricing/${testPricing.id}`)
        .set('Cookie', cookie);
      expect(delPricingRes.status).toBe(200);
      expect(delPricingRes.body.success).toBe(true);

      // Clean up test data
      await request(app)
        .put('/api/admin/content/general')
        .set('Cookie', cookie)
        .send({ tagline: 'Small Dream, Big Zenith — เปลี่ยนไอเดียเล็ก ๆ ให้กลายเป็นผลงานที่ไปได้ไกลกว่าที่คิด' });
      await request(app)
        .put('/api/admin/content/socials')
        .set('Cookie', cookie)
        .send({ discord: { url: '', label: 'Discord Server', enabled: false } });
    });
  });
});
