import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

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
  tagline: 'Small Dream, Big Zenith — เปลี่ยนไอเดียเล็ก ๆ ให้กลายเป็นผลงานที่ไปได้ไกลกว่าที่คิด',
  announcement: '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอสร้างสรรค์งานดิจิทัล เว็บไซต์ และดีไซน์',
  adminPin: '3645',
  socials: {
    line: {
      url: 'https://line.me/ti/p/~luvxawrnrkc',
      label: 'Line ID: luvxawrnrkc',
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

export async function getShopConfig() {
  if (!supabase) return { settings: { ...DEFAULT_SETTINGS }, categories: ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์'] };

  try {
    const data = check(
      await supabase.from('shop_config').select('*').eq('id', 'main').maybeSingle(),
      'read shop_config'
    );

    if (!data) return { settings: { ...DEFAULT_SETTINGS }, categories: ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์'] };

    return {
      settings: {
        shopName: data.shop_name || DEFAULT_SETTINGS.shopName,
        tagline: data.tagline || DEFAULT_SETTINGS.tagline,
        announcement: data.announcement || DEFAULT_SETTINGS.announcement,
        adminPin: data.admin_pin || config.adminPinFallback || DEFAULT_SETTINGS.adminPin,
        socials: data.socials || DEFAULT_SETTINGS.socials,
        stats: data.stats || DEFAULT_SETTINGS.stats
      },
      categories: data.categories || ['ทั้งหมด', 'ทั่วไป', 'เว็บไซต์', 'ดีไซน์']
    };
  } catch (err) {
    console.warn('[db] getShopConfig fallback:', err.message);
    return { settings: { ...DEFAULT_SETTINGS }, categories: ['ทั้งหมด', 'ทั่วไป'] };
  }
}

export async function updateShopSettings(newSettings) {
  if (!supabase) return { ...DEFAULT_SETTINGS, ...newSettings };

  const row = { id: 'main', updated_at: new Date().toISOString() };
  if (newSettings.shopName !== undefined) row.shop_name = newSettings.shopName;
  if (newSettings.tagline !== undefined) row.tagline = newSettings.tagline;
  if (newSettings.announcement !== undefined) row.announcement = newSettings.announcement;
  if (newSettings.adminPin !== undefined) row.admin_pin = newSettings.adminPin;
  if (newSettings.socials !== undefined) row.socials = newSettings.socials;
  if (newSettings.stats !== undefined) row.stats = newSettings.stats;

  check(await supabase.from('shop_config').upsert(row, { onConflict: 'id' }), 'update settings');
  return (await getShopConfig()).settings;
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

export async function getCredits({ category, search, sort } = {}) {
  if (!supabase) return [];

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
  if (!supabase || !id) return null;
  const data = check(
    await supabase.from('credits').select('*').eq('id', id).maybeSingle(),
    'read credit by id'
  );
  return data ? rowToCredit(data) : null;
}

export async function createCredit(credit) {
  if (!supabase) return credit;
  const data = check(
    await supabase.from('credits').insert(creditToRow(credit)).select().single(),
    'create credit'
  );
  return rowToCredit(data);
}

export async function updateCredit(id, updates) {
  if (!supabase) return null;
  const row = creditToRow(updates);
  delete row.id;
  const data = check(
    await supabase.from('credits').update(row).eq('id', id).select().maybeSingle(),
    'update credit'
  );
  return data ? rowToCredit(data) : null;
}

export async function deleteCredit(id) {
  if (!supabase) return true;
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
  return updated.isPinned;
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

export async function getCustomerReviews() {
  if (!supabase) return [];

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

  if (!supabase) return row;

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
  if (!supabase || !id) return true;
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
