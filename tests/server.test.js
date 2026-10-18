import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
    } catch (e) {
      if (e && e.code !== 'ENOENT') {
        console.warn('[tests] Cleanup notice for tempDir:', e.message);
      }
    }
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

    it('GET /portfolio redirects 302 to /#portfolio', async () => {
      const res = await request(app).get('/portfolio');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/#portfolio');
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

    it('never includes a PIN or PIN hash in an exported backup', async () => {
      const res = await request(app)
        .get('/api/admin/export')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const backup = JSON.parse(res.text);
      expect(backup.settings.adminPin).toBeUndefined();
      expect(backup.settings.adminPinHash).toBeUndefined();
    });

    it('does not accept authentication material from an imported backup', async () => {
      const backup = {
        settings: {
          shopName: 'SUNFZENITH',
          adminPin: 'attacker-controlled-pin',
          adminPinHash: 'scrypt:fake-salt:fake-hash'
        }
      };

      const importRes = await request(app)
        .post('/api/admin/import')
        .set('Cookie', adminCookie)
        .attach('backupFile', Buffer.from(JSON.stringify(backup)), {
          filename: 'backup.json',
          contentType: 'application/json'
        });

      expect(importRes.status).toBe(200);
      const loginRes = await request(app).post('/api/admin/login').send({ pin: TEST_PIN });
      expect(loginRes.status).toBe(200);
    });

    it('validates all sections of backup file before writing and leaves system untouched on partial invalidity', async () => {
      const partialInvalidBackup = {
        settings: {
          shopName: 'MUTATED_SHOP_NAME_SHOULD_NOT_PERSIST',
          tagline: 'MUTATED_TAGLINE'
        },
        credits: [
          { id: 'bad-credit-1', price: -50 } // invalid: missing title & negative price
        ]
      };

      const importRes = await request(app)
        .post('/api/admin/import')
        .set('Cookie', adminCookie)
        .attach('backupFile', Buffer.from(JSON.stringify(partialInvalidBackup)), {
          filename: 'invalid-backup.json',
          contentType: 'application/json'
        });

      expect(importRes.status).toBe(400);
      expect(importRes.body.success).toBe(false);

      const settingsRes = await request(app).get('/api/public/settings');
      expect(settingsRes.status).toBe(200);
      expect(settingsRes.body.settings.shopName).toBe('SUNFZENITH');
    });
  });

  describe('Credit input security', () => {
    it('rejects an unsafe externally supplied credit image URL', async () => {
      const res = await request(app)
        .post('/api/admin/credits')
        .set('Cookie', adminCookie)
        .field('title', 'Unsafe image test')
        .field('imageUrl', 'javascript:alert(1)');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('retains existing proof images and cleans up only newly uploaded images when credit update fails', async () => {
      const dbModule = await import('../src/server/services/db.js');
      const { vi } = await import('vitest');

      const createRes = await request(app)
        .post('/api/admin/credits')
        .set('Cookie', adminCookie)
        .field('title', 'Credit With Existing Proof')
        .field('imageUrl', 'https://example.com/existing-proof.jpg');
      expect(createRes.status).toBe(200);
      const creditId = createRes.body.credit.id;

      const deletedImageBatches = [];
      const deleteSpy = vi
        .spyOn(dbModule, 'deleteImagesFromStorage')
        .mockImplementation(async (imgs) => {
          deletedImageBatches.push(imgs);
        });
      const uploadSpy = vi
        .spyOn(dbModule, 'uploadImage')
        .mockResolvedValue({ url: '/images/uploads/new-temp-proof.png', fileName: 'new-temp-proof.png' });
      const updateSpy = vi
        .spyOn(dbModule, 'updateCredit')
        .mockRejectedValue(new Error('Simulated DB write failure'));

      // Valid minimal 1x1 PNG signature buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ]);

      try {
        const updateRes = await request(app)
          .put(`/api/admin/credits/${creditId}`)
          .set('Cookie', adminCookie)
          .field('title', 'Attempted Update')
          .field('remainingImages', JSON.stringify([]))
          .attach('images', pngBuffer, { filename: 'new.png', contentType: 'image/png' });

        expect(updateRes.status).toBe(400);
        expect(updateRes.body.success).toBe(false);

        // Old image must NOT be in any deleted batch; only the newly uploaded image should be rolled back
        const allDeleted = deletedImageBatches.flat();
        expect(allDeleted).not.toContain('https://example.com/existing-proof.jpg');
        expect(allDeleted).toContain('/images/uploads/new-temp-proof.png');
      } finally {
        updateSpy.mockRestore();
        uploadSpy.mockRestore();
        deleteSpy.mockRestore();
        await dbModule.deleteCredit(creditId);
      }
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

  describe('Production Build Enforcement & Legacy Fallback Prevention', () => {
    it('ensures "vite" is in dependencies (not devDependencies) for production builds', () => {
      const pkgPath = path.resolve(__dirname, '../package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(pkg.dependencies).toHaveProperty('vite');
      expect(pkg.devDependencies?.vite).toBeUndefined();
    });

    it('throws an error on startup in production when dist/index.html is missing', () => {
      const nonExistentDist = path.join(tempDir, 'missing-dist-test');
      expect(() => {
        createApp({
          isProd: true,
          distDir: nonExistentDist
        });
      }).toThrow(/Production bundle missing:.*index\.html.*was not found/);
    });

    it('serves modern web/index.html and never legacy public/index.html in development without dist', async () => {
      const nonExistentDist = path.join(tempDir, 'missing-dist-test');
      const devApp = createApp({
        isProd: false,
        distDir: nonExistentDist
      });

      const res = await request(devApp).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Small Dream, Big Zenith');
      expect(res.text).not.toContain('SUNFZENITH - รวมเครดิตการซื้อขาย');
    });

    it('serves web/credits.html and never legacy public/index.html in development without dist', async () => {
      const nonExistentDist = path.join(tempDir, 'missing-dist-test');
      const devApp = createApp({
        isProd: false,
        distDir: nonExistentDist
      });

      const res = await request(devApp).get('/credits');
      expect(res.status).toBe(200);
      expect(res.text).toContain('สมุดรวมเครดิต');
      expect(res.text).not.toContain('SUNFZENITH - รวมเครดิตการซื้อขาย');
    });

    it('serves web/404.html and never legacy public/index.html in development without dist', async () => {
      const nonExistentDist = path.join(tempDir, 'missing-dist-test');
      const devApp = createApp({
        isProd: false,
        distDir: nonExistentDist
      });

      const res = await request(devApp).get('/non-existent-page-test-404');
      expect(res.status).toBe(404);
      expect(res.text).toContain('404');
      expect(res.text).not.toContain('SUNFZENITH - รวมเครดิตการซื้อขาย');
    });

    it('never serves legacy public/index.html across any page endpoint', async () => {
      const legacyPath = path.resolve(__dirname, '../public/index.html');
      const legacyHtml = fs.readFileSync(legacyPath, 'utf8');

      const resHome = await request(app).get('/');
      expect(resHome.text).not.toBe(legacyHtml);
      expect(resHome.text).not.toContain('SUNFZENITH - รวมเครดิตการซื้อขาย');

      const resCredits = await request(app).get('/credits');
      expect(resCredits.text).not.toBe(legacyHtml);
      expect(resCredits.text).not.toContain('SUNFZENITH - รวมเครดิตการซื้อขาย');
    });

    it('postinstall fails with exit code 1 if vite is missing', () => {
      const postinstallScript = path.resolve(__dirname, '../scripts/postinstall.js');
      const fakeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'postinstall-missing-vite-'));
      const fakeScriptsDir = path.join(fakeDir, 'scripts');
      fs.mkdirSync(fakeScriptsDir, { recursive: true });
      fs.copyFileSync(postinstallScript, path.join(fakeScriptsDir, 'postinstall.js'));

      const res = spawnSync(process.execPath, [path.join(fakeScriptsDir, 'postinstall.js')], {
        cwd: fakeDir,
        env: { ...process.env, SKIP_WEB_BUILD: '0' },
        encoding: 'utf8'
      });

      expect(res.status).toBe(1);
      expect(res.stderr).toContain('Vite is required in "dependencies"');

      fs.rmSync(fakeDir, { recursive: true, force: true });
    });
  });
});
