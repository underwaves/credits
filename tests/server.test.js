import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary isolated data directory for integration testing (never touches src/server/data)
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sunfzenith-test-'));
const srcDataDir = path.resolve(__dirname, '../src/server/data');
if (fs.existsSync(srcDataDir)) {
  fs.cpSync(srcDataDir, tempDir, { recursive: true });
}
process.env.DATA_DIR = tempDir;

const TEST_PIN = 'test-suite-secure-admin-pin-2026';
process.env.ADMIN_PIN = TEST_PIN;

const { readEnv } = await import('../src/server/config.js');
const { createApp } = await import('../src/server/app.js');

describe('Server & Endpoints', () => {
  const app = createApp();

  let initialContentStat = null;
  let initialPortfolioStat = null;

  beforeAll(() => {
    // Record baseline timestamps and contents of production data files
    const contentPath = path.join(srcDataDir, 'content.json');
    const portfolioPath = path.join(srcDataDir, 'portfolio.json');
    if (fs.existsSync(contentPath)) {
      initialContentStat = fs.readFileSync(contentPath, 'utf8');
    }
    if (fs.existsSync(portfolioPath)) {
      initialPortfolioStat = fs.readFileSync(portfolioPath, 'utf8');
    }
  });

  afterAll(() => {
    // 1. Verify production data files were NEVER modified during tests
    const contentPath = path.join(srcDataDir, 'content.json');
    const portfolioPath = path.join(srcDataDir, 'portfolio.json');
    if (initialContentStat !== null) {
      expect(fs.readFileSync(contentPath, 'utf8')).toBe(initialContentStat);
    }
    if (initialPortfolioStat !== null) {
      expect(fs.readFileSync(portfolioPath, 'utf8')).toBe(initialPortfolioStat);
    }

    // 2. Remove temporary test fixtures directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  });

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

  let adminCookie = null;

  describe('Public API', () => {
    it('GET /api/public/settings returns shop settings', async () => {
      const res = await request(app).get('/api/public/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.shopName).toBe('SUNFZENITH');
      expect(res.body.settings.adminPin).toBeUndefined();
      expect(res.body.settings.adminPinHash).toBeUndefined();
    });
  });

  describe('Admin Auth & Session Security', () => {
    it('POST /api/admin/login fails with wrong PIN', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ pin: '0000' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ไม่ถูกต้อง');
    });

    it('POST /api/admin/login rejects insecure legacy fallback PINs (1234, 3645)', async () => {
      const res1 = await request(app).post('/api/admin/login').send({ pin: '1234' });
      expect(res1.status).toBe(401);
    });

    it('POST /api/admin/login succeeds with configured PIN and issues HttpOnly cookie without token in JSON', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ pin: TEST_PIN });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Requirement 4: token must NOT be returned in JSON response
      expect(res.body.token).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('admin_token');
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
      adminCookie = res.headers['set-cookie'];
    });

    it('Admin can change PIN and login with the new PIN', async () => {
      // 1. Initial login with current TEST_PIN
      const loginRes = await request(app)
        .post('/api/admin/login')
        .send({ pin: TEST_PIN });
      expect(loginRes.status).toBe(200);
      const sessionCookie = loginRes.headers['set-cookie'];

      // 2. Change PIN via POST /api/admin/change-pin
      const NEW_PIN = 'new-super-secure-pin-2026';
      const changeRes = await request(app)
        .post('/api/admin/change-pin')
        .set('Cookie', sessionCookie)
        .send({
          currentPin: TEST_PIN,
          newPin: NEW_PIN
        });
      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // 3. Old PIN login should fail
      const loginOldRes = await request(app)
        .post('/api/admin/login')
        .send({ pin: TEST_PIN });
      expect(loginOldRes.status).toBe(401);
      expect(loginOldRes.body.success).toBe(false);

      // 4. New PIN login should succeed
      const loginNewRes = await request(app)
        .post('/api/admin/login')
        .send({ pin: NEW_PIN });
      expect(loginNewRes.status).toBe(200);
      expect(loginNewRes.body.success).toBe(true);
      expect(loginNewRes.headers['set-cookie']).toBeDefined();

      // 5. Restore PIN back to TEST_PIN for subsequent tests
      const restoreRes = await request(app)
        .post('/api/admin/change-pin')
        .set('Cookie', loginNewRes.headers['set-cookie'])
        .send({
          currentPin: NEW_PIN,
          newPin: TEST_PIN
        });
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.success).toBe(true);
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
      const cookie = adminCookie;

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
      const cookie = adminCookie;

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
    });
  });

  describe('Configuration & Production Key Enforcement', () => {
    const validSecret = 'a'.repeat(32);

    it('throws error in production if SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is missing (even with legacy anon JWT in SUPABASE_KEY)', () => {
      const legacyAnonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDAwMDAwMH0.signature';

      expect(() => {
        readEnv({
          NODE_ENV: 'production',
          SESSION_SECRET: validSecret,
          SUPABASE_URL: 'https://test-project.supabase.co',
          SUPABASE_KEY: legacyAnonJwt
        });
      }).toThrow(/SUPABASE_SERVICE_ROLE_KEY must be configured/);
    });

    it('throws error in production if SUPABASE_URL is set and publishable key is passed in SUPABASE_KEY', () => {
      expect(() => {
        readEnv({
          NODE_ENV: 'production',
          SESSION_SECRET: validSecret,
          SUPABASE_URL: 'https://test-project.supabase.co',
          SUPABASE_KEY: 'sb_publishable_test_key_12345'
        });
      }).toThrow(/SUPABASE_SERVICE_ROLE_KEY must be configured/);
    });

    it('succeeds in production when SUPABASE_SERVICE_ROLE_KEY is provided', () => {
      const cfg = readEnv({
        NODE_ENV: 'production',
        SESSION_SECRET: validSecret,
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-secret-key-prod'
      });
      expect(cfg.supabaseKey).toBe('test-service-role-secret-key-prod');
    });

    it('succeeds in production when SUPABASE_SECRET_KEY is provided', () => {
      const cfg = readEnv({
        NODE_ENV: 'production',
        SESSION_SECRET: validSecret,
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_SECRET_KEY: 'test-secret-key-prod'
      });
      expect(cfg.supabaseKey).toBe('test-secret-key-prod');
    });

    it('allows SUPABASE_KEY in development mode', () => {
      const cfg = readEnv({
        NODE_ENV: 'development',
        SUPABASE_URL: 'https://test-project.supabase.co',
        SUPABASE_KEY: 'legacy-anon-jwt-or-publishable-key'
      });
      expect(cfg.supabaseKey).toBe('legacy-anon-jwt-or-publishable-key');
    });
  });
});
