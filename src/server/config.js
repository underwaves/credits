// Centralised, validated configuration. Secrets come ONLY from environment variables.
import crypto from 'node:crypto';

function readEnv(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production' || Boolean(env.RENDER);

  let sessionSecret = env.SESSION_SECRET || '';
  let sessionSecretEphemeral = false;
  if (sessionSecret.length < 32) {
    // Never fall back to a hard-coded secret. A random per-process secret is safe
    // (admins just need to log in again after a restart) and impossible to guess.
    if (sessionSecret) {
      console.warn('[config] SESSION_SECRET is shorter than 32 chars → ignoring it and using a random per-process secret. Set a long random value.');
    } else if (isProd) {
      console.warn('[config] SESSION_SECRET is not set → using a random per-process secret (admin sessions reset on restart).');
    }
    sessionSecret = crypto.randomBytes(48).toString('base64url');
    sessionSecretEphemeral = true;
  }

  const siteUrl = (env.SITE_URL || 'https://sunfz-credits.onrender.com').replace(/\/+$/, '');

  return Object.freeze({
    nodeEnv,
    isProd,
    port: Number(env.PORT) || 3000,
    siteUrl,
    sessionSecret,
    sessionSecretEphemeral,
    // Optional bootstrap PIN used only if the DB has none. No hard-coded default.
    adminPinFallback: env.ADMIN_PIN || '',
    supabaseUrl: env.SUPABASE_URL || '',
    // Prefer a server-only secret key; fall back to the legacy key for backwards compatibility.
    supabaseKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || '',
    contactWebhookUrl: env.CONTACT_WEBHOOK_URL || '',
    // Number of reverse proxies in front of the app (Render = 1). Used for req.ip.
    trustProxy: env.TRUST_PROXY !== undefined ? Number(env.TRUST_PROXY) : (isProd ? 1 : 0)
  });
}

export const config = readEnv();
export { readEnv };
