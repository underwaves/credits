import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { hashPin } from '../middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

const BUCKET = 'credit-images';

let supabase = null;
if (config.supabaseUrl && config.supabaseKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false }
  });
}

function check({ data, error }, action) {
  if (error) throw new Error(`Supabase ${action}: ${error.message}`);
  return data;
}

export const DEFAULT_SETTINGS = {
  shopName: 'SUNFZENITH',
  tagline: 'Small Dream, Big Zenith',
  announcement: '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอสร้างสรรค์งานดิจิทัล เว็บไซต์ และดีไซน์',
  adminPinHash: null,
  socials: {
    line: {
      url: 'https://line.me/R/ti/p/@419ajynp',
      label: 'LINE OA: @419ajynp',
      enabled: true
    },
    facebook: {
      url: 'https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH',
      label: 'Facebook Page',
      enabled: true
    },
    discord: {
      url: '',
      label: 'Discord Server',
      enabled: false
    },
    tiktok: {
      url: '',
      label: 'TikTok',
      enabled: false
    }
  },
  stats: {
    ratingScore: '5.0',
    totalOrders: 'ผลงานคุณภาพ 100%',
    deliveryRate: 'ส่งตรงเวลา ใส่ใจทุกรายละเอียด',
    responseTime: 'ตอบกลับรวดเร็ว',
    warrantyPeriod: 'ดูแลหลังส่งมอบ'
  }
};

function rowToCredit(r) {
  return {
    id: r.id,
    title: r.title,
    game: r.game || 'ทั่วไป',
    price: Number(r.price) || 0,
    customer: r.customer,
    rating: r.rating || 5,
    date: r.date,
    timeAgo: r.time_ago,
    images: Array.isArray(r.images) ? r.images : [],
    description: r.description || '',
    isPinned: Boolean(r.is_pinned),
    createdAt: r.created_at
  };
}

function creditToRow(c) {
  const row = {};
  if (c.id !== undefined) row.id = c.id;
  if (c.title !== undefined) row.title = c.title;
  if (c.game !== undefined) row.game = c.game;
  if (c.price !== undefined) row.price = c.price;
  if (c.customer !== undefined) row.customer = c.customer;
  if (c.rating !== undefined) row.rating = c.rating;
  if (c.date !== undefined) row.date = c.date;
  if (c.timeAgo !== undefined) row.time_ago = c.timeAgo;
  if (c.images !== undefined) row.images = c.images;
  if (c.description !== undefined) row.description = c.description;
  if (c.isPinned !== undefined) row.is_pinned = c.isPinned;
  if (c.createdAt !== undefined) row.created_at = c.createdAt;
  return row;
}

// ---------------- Shop Config ----------------

let localSettings = { ...DEFAULT_SETTINGS };

export function _resetLocalSettings() {
  localSettings = { ...DEFAULT_SETTINGS };
}

export async function getShopConfig() {
  const fallbackHash = config.adminPinFallback || null;
  if (!supabase) {
    const adminPinHash = localSettings.adminPinHash || fallbackHash;
    return {
      settings: { ...localSettings, adminPinHash },
      categories: ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์']
    };
  }

  try {
    const data = check(
      await supabase.from('shop_config').select('*').eq('id', 'main').maybeSingle(),
      'read shop_config'
    );

    if (!data) {
      return {
        settings: { ...DEFAULT_SETTINGS, adminPinHash: fallbackHash },
        categories: ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์']
      };
    }

    const storedPin = data.admin_pin_hash || data.admin_pin || null;
    let adminPinHash = null;
    if (storedPin && typeof storedPin === 'string') {
      const trimmed = storedPin.trim();
      if (trimmed !== '3645' && trimmed !== '1234') {
        if (trimmed.startsWith('scrypt:')) {
          adminPinHash = trimmed;
        } else {
          // Compatibility with legacy database that had custom plain pin
          adminPinHash = trimmed;
        }
      }
    }
    if (!adminPinHash && fallbackHash) {
      adminPinHash = fallbackHash;
    }

    return {
      settings: {
        shopName: data.shop_name || DEFAULT_SETTINGS.shopName,
        tagline: data.tagline || DEFAULT_SETTINGS.tagline,
        announcement: data.announcement || DEFAULT_SETTINGS.announcement,
        adminPinHash,
        socials: data.socials || DEFAULT_SETTINGS.socials,
        stats: data.stats || DEFAULT_SETTINGS.stats
      },
      categories: data.categories || ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์']
    };
  } catch (err) {
    console.warn('[db] getShopConfig fallback:', err.message);
    return { settings: { ...DEFAULT_SETTINGS, adminPinHash: fallbackHash }, categories: ['ทั้งหมด', 'ทั่วไป'] };
  }
}

export async function updateShopSettings(newSettings) {
  if (!supabase) {
    if (newSettings.adminPin !== undefined && newSettings.adminPin !== null) {
      const cleanPin = String(newSettings.adminPin).trim();
      if (cleanPin) {
        localSettings.adminPinHash = hashPin(cleanPin);
      }
    } else if (newSettings.adminPinHash !== undefined) {
      localSettings.adminPinHash = newSettings.adminPinHash;
    }
    if (newSettings.shopName !== undefined) localSettings.shopName = newSettings.shopName;
    if (newSettings.tagline !== undefined) localSettings.tagline = newSettings.tagline;
    if (newSettings.announcement !== undefined) localSettings.announcement = newSettings.announcement;
    if (newSettings.socials !== undefined) localSettings.socials = newSettings.socials;
    if (newSettings.stats !== undefined) localSettings.stats = newSettings.stats;
    const { adminPin, adminPinHash, ...safeSettings } = localSettings;
    return safeSettings;
  }

  const row = { id: 'main', updated_at: new Date().toISOString() };
  if (newSettings.shopName !== undefined) row.shop_name = newSettings.shopName;
  if (newSettings.tagline !== undefined) row.tagline = newSettings.tagline;
  if (newSettings.announcement !== undefined) row.announcement = newSettings.announcement;

  // Only write to admin_pin_hash (new schema does not have admin_pin column)
  if (newSettings.adminPin !== undefined && newSettings.adminPin !== null) {
    const cleanPin = String(newSettings.adminPin).trim();
    if (cleanPin) {
      row.admin_pin_hash = hashPin(cleanPin);
    }
  } else if (newSettings.adminPinHash !== undefined) {
    row.admin_pin_hash = newSettings.adminPinHash;
  }

  if (newSettings.socials !== undefined) row.socials = newSettings.socials;
  if (newSettings.stats !== undefined) row.stats = newSettings.stats;

  check(await supabase.from('shop_config').upsert(row, { onConflict: 'id' }), 'update settings');
  const freshSettings = (await getShopConfig()).settings;
  const { adminPin, adminPinHash, ...safeSettings } = freshSettings;
  return safeSettings;
}

export async function updateCategories(categories) {
  if (!supabase) return categories;
  check(
    await supabase.from('shop_config').upsert({ id: 'main', categories, updated_at: new Date().toISOString() }, { onConflict: 'id' }),
    'update categories'
  );
  return categories;
}

// ---------------- Credits ----------------

function getDataDir() {
  return process.env.DATA_DIR || path.join(rootDir, 'src', 'server', 'data');
}

function getCreditsFilePath() {
  return path.join(getDataDir(), 'credits.json');
}

function readLocalCredits() {
  try {
    const file = getCreditsFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) return data;
    }
    const defaultFile = path.join(rootDir, 'src', 'server', 'data', 'credits.json');
    if (fs.existsSync(defaultFile)) {
      const data = JSON.parse(fs.readFileSync(defaultFile, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[db] Failed reading local credits:', err.message);
  }
  return [];
}

function writeLocalCredits(list) {
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getCreditsFilePath(), JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[db] Failed writing local credits:', err.message);
  }
}

export async function getCredits({ category, search, sort } = {}) {
  if (!supabase) {
    let items = readLocalCredits().map(rowToCredit);

    if (category && category !== 'ทั้งหมด') {
      items = items.filter(c => c.game === category);
    }

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter(c => 
        (c.title && c.title.toLowerCase().includes(s)) ||
        (c.customer && c.customer.toLowerCase().includes(s)) ||
        (c.description && c.description.toLowerCase().includes(s))
      );
    }

    if (sort === 'price-high') {
      items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'price-low') {
      items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else {
      items.sort((a, b) => {
        if (Boolean(b.isPinned) !== Boolean(a.isPinned)) {
          return Boolean(b.isPinned) ? 1 : -1;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return items;
  }

  let q = supabase.from('credits').select('*');

  if (category && category !== 'ทั้งหมด') {
    q = q.eq('game', category);
  }

  if (search && search.trim()) {
    const s = search.trim().replace(/[%_,'"()\\*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (s) {
      q = q.or(`title.ilike.%${s}%,customer.ilike.%${s}%,description.ilike.%${s}%`);
    }
  }

  if (sort === 'price-high') q = q.order('price', { ascending: false });
  else if (sort === 'price-low') q = q.order('price', { ascending: true });
  else q = q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });

  const rows = check(await q, 'read credits');
  return (rows || []).map(rowToCredit);
}

export async function getCreditById(id) {
  if (!id) return null;
  if (!supabase) {
    const list = readLocalCredits().map(rowToCredit);
    return list.find(c => String(c.id) === String(id)) || null;
  }
  const data = check(
    await supabase.from('credits').select('*').eq('id', id).maybeSingle(),
    'read credit by id'
  );
  return data ? rowToCredit(data) : null;
}

export async function createCredit(credit) {
  if (!supabase) {
    const list = readLocalCredits();
    const id = credit.id || `c-${Date.now()}`;
    const newCredit = {
      ...credit,
      id,
      createdAt: credit.createdAt || new Date().toISOString()
    };
    list.unshift(newCredit);
    writeLocalCredits(list);
    return rowToCredit(newCredit);
  }
  const data = check(
    await supabase.from('credits').insert(creditToRow(credit)).select().single(),
    'create credit'
  );
  return rowToCredit(data);
}

export async function updateCredit(id, updates) {
  if (!id) return null;
  if (!supabase) {
    const list = readLocalCredits();
    const idx = list.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, id };
    writeLocalCredits(list);
    return rowToCredit(list[idx]);
  }
  const row = creditToRow(updates);
  delete row.id;
  const data = check(
    await supabase.from('credits').update(row).eq('id', id).select().maybeSingle(),
    'update credit'
  );
  return data ? rowToCredit(data) : null;
}

export async function deleteCredit(id) {
  if (!id) return true;
  if (!supabase) {
    const list = readLocalCredits();
    const existing = list.find(c => String(c.id) === String(id));
    const filtered = list.filter(c => String(c.id) !== String(id));
    writeLocalCredits(filtered);
    if (existing && existing.images) {
      await deleteImagesFromStorage(existing.images);
    }
    return true;
  }
  const existing = await getCreditById(id);
  check(await supabase.from('credits').delete().eq('id', id), 'delete credit');

  if (existing && existing.images) {
    await deleteImagesFromStorage(existing.images);
  }
  return true;
}

export async function togglePinCredit(id) {
  const credit = await getCreditById(id);
  if (!credit) return null;
  const updated = await updateCredit(id, { isPinned: !credit.isPinned });
  return updated ? updated.isPinned : false;
}

// ---------------- Storage ----------------

export async function uploadImage(buffer, detectedExt = '.jpg', mimeType = 'image/jpeg') {
  const ext = detectedExt.startsWith('.') ? detectedExt : `.${detectedExt}`;
  const fileName = `img-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

  if (supabase) {
    try {
      check(
        await supabase.storage.from(BUCKET).upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        }),
        'upload image'
      );

      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
      return { url: publicUrl, fileName };
    } catch (err) {
      console.warn('[db.uploadImage] Supabase upload failed, falling back to local file storage:', err.message);
    }
  }

  // Local file storage fallback
  const targetDirs = [
    path.join(rootDir, 'public', 'images', 'uploads'),
    path.join(rootDir, 'web', 'public', 'images', 'uploads'),
    path.join(rootDir, 'dist', 'images', 'uploads')
  ];

  for (const dir of targetDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, fileName), buffer);
    } catch (err) {
      console.warn(`[db.uploadImage] Failed writing to ${dir}:`, err.message);
    }
  }

  return { url: `/images/uploads/${fileName}`, fileName };
}

export async function deleteImagesFromStorage(imageUrlsOrNames) {
  if (!Array.isArray(imageUrlsOrNames) || imageUrlsOrNames.length === 0) return;

  if (supabase) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const fileNames = imageUrlsOrNames
      .map((item) => {
        if (typeof item !== 'string') return null;
        if (item.includes(marker)) return item.split(marker)[1];
        if (!item.startsWith('/') && !item.startsWith('http')) return item;
        return null;
      })
      .filter(Boolean);

    if (fileNames.length > 0) {
      try {
        await supabase.storage.from(BUCKET).remove(fileNames);
      } catch (err) {
        console.warn('[db] Storage cleanup warning:', err.message);
      }
    }
  }

  // Clean up any local files
  for (const item of imageUrlsOrNames) {
    if (typeof item === 'string' && item.includes('/images/uploads/')) {
      const fileName = path.basename(item);
      const targetDirs = [
        path.join(rootDir, 'public', 'images', 'uploads'),
        path.join(rootDir, 'web', 'public', 'images', 'uploads'),
        path.join(rootDir, 'dist', 'images', 'uploads')
      ];
      for (const dir of targetDirs) {
        const filePath = path.join(dir, fileName);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (_) {}
        }
      }
    }
  }
}

// ---------------- Customer Reviews (+1 / -1) ----------------

function getReviewsFilePath() {
  return path.join(getDataDir(), 'reviews.json');
}

function readLocalReviews() {
  try {
    const file = getReviewsFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

function writeLocalReviews(list) {
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getReviewsFilePath(), JSON.stringify(list, null, 2), 'utf8');
  } catch {}
}

export async function getCustomerReviews() {
  if (!supabase) {
    return readLocalReviews();
  }

  try {
    const { data, error } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((r) => ({
        id: r.id,
        type: r.type,
        customerName: r.customer_name,
        message: r.message || '',
        images: Array.isArray(r.images) ? r.images : [],
        createdAt: r.created_at
      }));
    }
  } catch {}

  // Fallback to shop_config.stats.customer_reviews
  try {
    const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').maybeSingle();
    if (cfg?.stats?.customer_reviews && Array.isArray(cfg.stats.customer_reviews)) {
      return cfg.stats.customer_reviews;
    }
  } catch {}

  return [];
}

export async function createCustomerReview({ type, customerName, message, images }) {
  const row = {
    id: `rev-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    type: type === '-1' ? '-1' : '+1',
    customer_name: customerName?.trim() || 'ลูกค้าทั่วไป',
    message: message?.trim() || '',
    images: Array.isArray(images) ? images : [],
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    const list = readLocalReviews();
    list.unshift(row);
    writeLocalReviews(list);
    return row;
  }

  try {
    const { data, error } = await supabase.from('customer_reviews').insert(row).select().maybeSingle();
    if (!error && data) {
      return {
        id: data.id,
        type: data.type,
        customerName: data.customer_name,
        message: data.message,
        images: data.images || [],
        createdAt: data.created_at
      };
    }
  } catch {}

  // Graceful fallback to shop_config.stats.customer_reviews
  const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').single();
  const currentStats = cfg?.stats || {};
  const list = currentStats.customer_reviews || [];
  const clientObj = {
    id: row.id,
    type: row.type,
    customerName: row.customer_name,
    message: row.message,
    images: row.images,
    createdAt: row.created_at
  };
  list.unshift(clientObj);
  await supabase.from('shop_config').update({
    stats: { ...currentStats, customer_reviews: list }
  }).eq('id', 'main');

  return clientObj;
}

export async function deleteCustomerReview(id) {
  if (!id) return true;
  if (!supabase) {
    const list = readLocalReviews();
    const target = list.find((r) => r.id === id);
    const filtered = list.filter((r) => r.id !== id);
    writeLocalReviews(filtered);
    if (target?.images) {
      await deleteImagesFromStorage(target.images);
    }
    return true;
  }
  let imagesToDelete = [];

  try {
    const { data } = await supabase.from('customer_reviews').select('images').eq('id', id).maybeSingle();
    if (data?.images) imagesToDelete = data.images;
    await supabase.from('customer_reviews').delete().eq('id', id);
  } catch {}

  try {
    const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').single();
    if (cfg?.stats?.customer_reviews && Array.isArray(cfg.stats.customer_reviews)) {
      const target = cfg.stats.customer_reviews.find((r) => r.id === id);
      if (target?.images) imagesToDelete = [...imagesToDelete, ...target.images];
      const filtered = cfg.stats.customer_reviews.filter((r) => r.id !== id);
      await supabase.from('shop_config').update({
        stats: { ...cfg.stats, customer_reviews: filtered }
      }).eq('id', 'main');
    }
  } catch {}

  if (imagesToDelete.length > 0) {
    await deleteImagesFromStorage(imagesToDelete);
  }

  return true;
}

// ---------------- Contact Messages ----------------

export async function saveContactMessage(msg) {
  const item = {
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name: msg.name,
    contact_channel: msg.contactChannel,
    contact_value: msg.contactValue,
    service: msg.service,
    budget: msg.budget,
    details: msg.details,
    ip: msg.ip || 'unknown',
    created_at: new Date().toISOString()
  };

  if (!supabase) return item;

  // Try dedicated table contact_messages
  try {
    const { data, error } = await supabase.from('contact_messages').insert(item).select().maybeSingle();
    if (!error && data) return data;
  } catch {}

  // Fallback to storing in shop_config stats so message is never lost
  try {
    const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').single();
    const currentStats = cfg?.stats || {};
    const messages = Array.isArray(currentStats.contact_messages) ? currentStats.contact_messages : [];
    messages.unshift(item);
    // Keep last 100 messages
    await supabase.from('shop_config').update({
      stats: { ...currentStats, contact_messages: messages.slice(0, 100) }
    }).eq('id', 'main');
  } catch (err) {
    console.error('[db] Failed to save contact message fallback:', err.message);
  }

  return item;
}

// ---------------- Health Check ----------------

export async function healthCheck() {
  if (!supabase) return true;
  await supabase.from('shop_config').select('id', { head: true, count: 'exact' });
  return true;
}
