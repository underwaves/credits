// Centralised, validated configuration. Secrets come ONLY from environment variables.
import crypto from 'node:crypto';

function readEnv(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production' || Boolean(env.RENDER);

  let sessionSecret = env.SESSION_SECRET || '';
  let sessionSecretEphemeral = false;

  if (isProd) {
    if (!sessionSecret || sessionSecret.trim().length < 32) {
      console.error('\n❌ [CRITICAL SECURITY ERROR] Application startup halted:');
      console.error('   SESSION_SECRET environment variable is missing or shorter than 32 characters in production.');
      console.error('   Please configure a strong, random SESSION_SECRET with at least 32 characters in your environment variables.\n');
      throw new Error('SESSION_SECRET must be configured and at least 32 characters long in production.');
    }
  } else {
    if (sessionSecret && sessionSecret.length < 32) {
      console.warn('[config] SESSION_SECRET is shorter than 32 chars → using a random per-process secret for development. Set a long random value.');
      sessionSecret = crypto.randomBytes(48).toString('base64url');
      sessionSecretEphemeral = true;
    } else if (!sessionSecret) {
      sessionSecret = crypto.randomBytes(48).toString('base64url');
      sessionSecretEphemeral = true;
    }
  }

  const siteUrl = (env.SITE_URL || 'https://sunfz-credits.onrender.com').replace(/\/+$/, '');

  const supabaseUrl = env.SUPABASE_URL || '';
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || '';

  if (isProd && supabaseUrl) {
    if (!serviceRoleKey) {
      console.error('\n❌ [CRITICAL SECURITY ERROR] Application startup halted:');
      console.error('   In production, the server API must use SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.');
      console.error('   Do NOT use SUPABASE_KEY (anon/publishable key or legacy anon JWT) for backend server operations in production.\n');
      throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured for the server in production.');
    }
  }

  const supabaseKey = isProd ? serviceRoleKey : (serviceRoleKey || env.SUPABASE_KEY || '');

  return Object.freeze({
    nodeEnv,
    isProd,
    port: Number(env.PORT) || 3000,
    siteUrl,
    sessionSecret,
    sessionSecretEphemeral,
    // Optional bootstrap PIN used only if the DB has none. No hard-coded default.
    adminPinFallback: env.ADMIN_PIN || '',
    supabaseUrl,
    supabaseKey,
    contactWebhookUrl: env.CONTACT_WEBHOOK_URL || '',
    // Number of reverse proxies in front of the app (Render = 1). Used for req.ip.
    trustProxy: env.TRUST_PROXY !== undefined ? Number(env.TRUST_PROXY) : (isProd ? 1 : 0)
  });
}

export const config = readEnv();
export { readEnv };
