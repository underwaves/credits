import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { securityHeaders, sameOriginGuard } from './middleware/security.js';
import { generalApiLimiter } from './middleware/rateLimit.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { seoRouter } from './routes/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export function createApp(customConfig = {}) {
  const effectiveConfig = { ...config, ...customConfig };
  const isProd = effectiveConfig.isProd ?? config.isProd;
  const distDir = customConfig.distDir || path.join(rootDir, 'dist');
  const distIndexPath = path.join(distDir, 'index.html');
  const mobileAdminDir = customConfig.mobileAdminDir || path.join(rootDir, 'mobile-admin', 'www');
  const mobileAdminIndexPath = path.join(mobileAdminDir, 'index.html');

  // Enforce frontend production bundle in production mode
  if (isProd && !fs.existsSync(distIndexPath)) {
    const errorMsg = `Production bundle missing: "${distIndexPath}" was not found. Run "npm run build" before starting the server in production.`;
    console.error('\n❌ [CRITICAL PRODUCTION ERROR] Frontend production bundle is missing:');
    console.error(`   "${distIndexPath}" not found.`);
    console.error('   In production, the frontend bundle must be built with "npm run build" before starting the server.');
    console.error('   Fallback to unbundled source or legacy public/index.html is strictly disabled in production.\n');
    throw new Error(errorMsg);
  }

  const app = express();

  // Trust proxy for Render and reverse proxies
  if (effectiveConfig.trustProxy) {
    app.set('trust proxy', effectiveConfig.trustProxy);
  }

  // Security Headers
  app.use(securityHeaders);

  // Performance Compression
  app.use(compression());

  // Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Same-origin guard for state-changing requests
  app.use(sameOriginGuard);

  // SEO routes (served dynamically with current date and configured siteUrl)
  app.use(seoRouter);

  // Static files caching:
  // In production, served exclusively from dist/.
  // In development, served from dist/ if built, else web/public (never legacy public/).
  const staticDir = fs.existsSync(distDir)
    ? distDir
    : path.join(rootDir, 'web', 'public');

  app.use(
    express.static(staticDir, {
      index: false,
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(css|js|woff2|svg|png|jpg|webp)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    })
  );

  // The Ionic admin is built into its own directory and shares this origin's API.
  app.use('/mobile-admin', express.static(mobileAdminDir, {
    index: false,
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (/\.(css|js|woff2|svg|png|jpg|webp)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get(/^\/mobile-admin(?:\/.*)?$/, (req, res, next) => {
    if (!fs.existsSync(mobileAdminIndexPath)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(mobileAdminIndexPath);
  });

  // Serve uploaded images statically
  const uploadsDir = path.join(rootDir, 'public', 'images', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/images/uploads', express.static(uploadsDir, { maxAge: '1d' }));

  // API Routes with rate limiting
  app.use('/api', generalApiLimiter);
  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);

  // Deep-link redirect: if visitor arrives at /?credit=<id>, 301 redirect to /credits?credit=<id>
  app.get('/', (req, res, next) => {
    if (req.query.credit) {
      return res.redirect(301, `/credits?credit=${encodeURIComponent(req.query.credit)}`);
    }
    next();
  });

  // Pages routing
  app.get('/', (req, res) => {
    if (fs.existsSync(distIndexPath)) {
      return res.sendFile(distIndexPath);
    }
    if (isProd) {
      return res.status(500).type('text/plain').send('Production bundle missing: dist/index.html was not found. Run "npm run build".');
    }
    const devIndexPath = path.join(rootDir, 'web', 'index.html');
    if (fs.existsSync(devIndexPath)) {
      return res.sendFile(devIndexPath);
    }
    res.status(500).type('text/plain').send('Frontend source missing: web/index.html was not found.');
  });

  app.get('/credits', (req, res) => {
    const distCreditsPath = path.join(distDir, 'credits.html');
    if (fs.existsSync(distCreditsPath)) {
      return res.sendFile(distCreditsPath);
    }
    if (isProd) {
      return res.status(500).type('text/plain').send('Production bundle missing: dist/credits.html was not found. Run "npm run build".');
    }
    const devCreditsPath = path.join(rootDir, 'web', 'credits.html');
    if (fs.existsSync(devCreditsPath)) {
      return res.sendFile(devCreditsPath);
    }
    res.status(404).type('text/plain').send('Credits page not found.');
  });

  app.get('/portfolio', (req, res) => {
    res.redirect('/#portfolio');
  });

  app.get('/locker', (req, res) => {
    const distLockerPath = path.join(distDir, 'locker', 'index.html');
    if (fs.existsSync(distLockerPath)) {
      return res.sendFile(distLockerPath);
    }
    const webLockerPath = path.join(rootDir, 'web', 'public', 'locker', 'index.html');
    if (fs.existsSync(webLockerPath)) {
      return res.sendFile(webLockerPath);
    }
    res.redirect('https://underwaves.github.io/smart-pharmacy-locker/');
  });

  app.get('/admin', (req, res) => {
    const distAdminPath = path.join(distDir, 'admin.html');
    if (fs.existsSync(distAdminPath)) {
      return res.sendFile(distAdminPath);
    }
    const webAdminPath = path.join(rootDir, 'web', 'public', 'admin.html');
    if (fs.existsSync(webAdminPath)) {
      return res.sendFile(webAdminPath);
    }
    res.status(404).type('text/plain').send('Admin page not found.');
  });

  // 404 Page handler
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }
    const distNotFoundPath = path.join(distDir, '404.html');
    if (fs.existsSync(distNotFoundPath)) {
      return res.status(404).sendFile(distNotFoundPath);
    }
    const devNotFoundPath = path.join(rootDir, 'web', '404.html');
    if (fs.existsSync(devNotFoundPath)) {
      return res.status(404).sendFile(devNotFoundPath);
    }
    res.status(404).type('text/plain').send('404 Page Not Found');
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[server error]', err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง'
    });
  });

  return app;
}
