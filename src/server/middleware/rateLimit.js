/**
 * Sliding window in-memory rate limiter with automatic cleanup.
 */
export function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.resetTime > windowMs) {
        hits.delete(key);
      }
    }
  }, Math.max(30000, Math.floor(windowMs / 2)));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        message: message || 'คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      });
    }

    next();
  };
}

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  message: 'คุณพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง'
});

export const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'คุณส่งข้อความติดต่อถี่เกินไป กรุณารอสักครู่ก่อนส่งใหม่อีกครั้ง'
});

export const reviewLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'คุณส่งรีวิวถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้งเพื่อป้องกันสแปม'
});

export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'คำขอถี่เกินไป กรุณารอสักครู่'
});
