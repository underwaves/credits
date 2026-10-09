import crypto from 'node:crypto';
import { config } from '../config.js';

const revokedTokens = new Set();

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate a signed HMAC session token for admin authentication.
 */
export function generateSessionToken() {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex')
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', config.sessionSecret).update(b64).digest('base64url');
  return `${b64}.${signature}`;
}

/**
 * Verify HMAC session token using timingSafeEqual.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [b64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', config.sessionSecret).update(b64).digest('base64url');
  if (!timingSafeEqualString(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function revokeToken(token) {
  if (token) revokedTokens.add(token);
}

/**
 * Security headers middleware.
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP allowing self, fonts, and inline scripts required for theme initialization
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https:; frame-ancestors 'self';"
  );

  next();
}

/**
 * Same-origin check for mutating requests (CSRF protection).
 */
export function sameOriginGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers['origin'];
  const host = req.headers['host'];

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return res.status(403).json({
          success: false,
          message: 'คำขอไม่ถูกต้อง (Cross-origin request blocked)'
        });
      }
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid Origin header' });
    }
  }

  next();
}

/**
 * Securely hash admin PIN with scrypt and a random salt.
 * Returns format: scrypt:<salt_hex>:<hash_hex>
 */
export function hashPin(pin) {
  if (!pin || (typeof pin !== 'string' && typeof pin !== 'number')) {
    throw new Error('PIN must be a non-empty string or number');
  }
  const pinStr = String(pin).trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(pinStr, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Constant-time verification of an input PIN against stored scrypt hash or env ADMIN_PIN.
 */
export function verifyPin(inputPin, storedValue) {
  if (!inputPin || !storedValue || typeof storedValue !== 'string') return false;
  const pinStr = String(inputPin).trim();
  const storedStr = storedValue.trim();

  // If stored as scrypt hash
  if (storedStr.startsWith('scrypt:')) {
    const parts = storedStr.split(':');
    if (parts.length === 3) {
      const [, salt, expectedKey] = parts;
      try {
        const derivedKey = crypto.scryptSync(pinStr, salt, 64).toString('hex');
        return timingSafeEqualString(derivedKey, expectedKey);
      } catch {
        return false;
      }
    }
    return false;
  }

  // Strictly disallow known insecure fallback PINs even if present in environment
  if (['3645', '1234', 'admin', 'password', '0000', '123456'].includes(storedStr)) {
    return false;
  }

  return timingSafeEqualString(pinStr, storedStr);
}

/**
 * Middleware requiring authenticated admin session via HttpOnly cookie.
 */
export function requireAdmin(req, res, next) {
  const token = req.cookies?.['admin_token'];
  if (!token || !verifySessionToken(token)) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบในฐานะแอดมิน'
    });
  }
  next();
}
