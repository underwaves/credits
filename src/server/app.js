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

export function createApp() {
  const app = express();

  // Trust proxy for Render and reverse proxies
  if (config.trustProxy) {
    app.set('trust proxy', config.trustProxy);
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

  // Determine client distribution path (prefer dist/ if built, else web/public or public/)
  const distDir = path.join(rootDir, 'dist');
  const publicDir = fs.existsSync(distDir) ? distDir : path.join(rootDir, 'public');

  // Static files caching
  app.use(
    express.static(publicDir, {
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

  // Serve uploaded images statically
  const uploadsDir = path.join(rootDir, 'public', 'images', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/images/uploads', express.static(uploadsDir, { maxAge: '1d' }));

  // SEO routes
  app.use(seoRouter);

  // API Routes with rate limiting
  app.use('/api', generalApiLimiter);
  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);

  // Deep-link redirect: if visitor arrives at /?credit=xxx, 301 redirect to /credits?credit=xxx
  app.get('/', (req, res, next) => {
    if (req.query.credit) {
      return res.redirect(301, `/credits?credit=${encodeURIComponent(req.query.credit)}`);
    }
    next();
  });

  // Pages routing
  app.get('/', (req, res) => {
    const indexPath = fs.existsSync(path.join(distDir, 'index.html'))
      ? path.join(distDir, 'index.html')
      : path.join(rootDir, 'web', 'index.html');
    res.sendFile(indexPath);
  });

  app.get('/credits', (req, res) => {
    const creditsPath = fs.existsSync(path.join(distDir, 'credits.html'))
      ? path.join(distDir, 'credits.html')
      : (fs.existsSync(path.join(rootDir, 'web', 'credits.html'))
          ? path.join(rootDir, 'web', 'credits.html')
          : path.join(publicDir, 'index.html'));
    res.sendFile(creditsPath);
  });

  app.get('/portfolio', (req, res) => {
    res.redirect('/#portfolio');
  });

  app.get('/admin', (req, res) => {
    const adminPath = fs.existsSync(path.join(publicDir, 'admin.html'))
      ? path.join(publicDir, 'admin.html')
      : path.join(rootDir, 'public', 'admin.html');
    res.sendFile(adminPath);
  });

  // 404 Page handler
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }
    const notFoundPath = fs.existsSync(path.join(distDir, '404.html'))
      ? path.join(distDir, '404.html')
      : (fs.existsSync(path.join(rootDir, 'web', '404.html'))
          ? path.join(rootDir, 'web', '404.html')
          : path.join(publicDir, 'index.html'));

    res.status(404).sendFile(notFoundPath);
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
