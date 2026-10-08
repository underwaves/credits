// Data layer: Supabase only.
// There is intentionally NO local-file fallback. On hosts like Render the disk is
// wiped on every restart, so a silent fallback would make data disappear.
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET = 'credit-images';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌ ไม่พบ SUPABASE_URL หรือ SUPABASE_KEY');
  console.error('   - ในเครื่อง: ใส่ค่าในไฟล์ .env');
  console.error('   - บน Render: ไปที่ Environment แล้วเพิ่มทั้ง 2 ตัว\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Throw on any Supabase error so routes return appropriate errors instead of pretending success.
function check({ data, error }, action) {
  if (error) throw new Error(`Supabase ${action}: ${error.message}`);
  return data;
}

const DEFAULT_SETTINGS = {
  shopName: 'SUNFZENITH',
  tagline: 'รวมหลักฐานและเครดิตการซื้อขายจริง เช็คประวัติได้ที่นี่ 100%',
  announcement: '✨ รวมเครดิตซื้อขายร้าน SUNFZENITH ซื้อขายปลอดภัย มีหลักฐานทุกรายการ!',
  adminPin: '3645',
  socials: {
    line: {
      url: 'https://line.me/R/ti/p/@419ajynp',
      label: 'LINE OA: @419ajynp',
      enabled: true
    },
    facebook: {
      url: 'https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH',
      label: 'Facebook',
      enabled: true
    },
    discord: {
      url: '',
      label: 'Discord Server',
      enabled: false
    },
    tiktok: {
      url: '',
      label: 'TikTok Shop',
      enabled: false
    }
  },
  stats: {
    ratingScore: '5.0',
    totalOrders: 'เครดิตจริง 100%',
    deliveryRate: 'ส่งไว ปลอดภัย',
    responseTime: 'ไม่กี่นาที',
    warrantyPeriod: 'มีประกัน'
  }
};

function rowToCredit(r) {
  return {
    id: r.id,
    title: r.title,
    game: r.game,
    price: Number(r.price) || 0,
    customer: r.customer,
    rating: r.rating,
    date: r.date,
    timeAgo: r.time_ago,
    images: r.images || [],
    description: r.description,
    isPinned: !!r.is_pinned,
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

// ---------------- Shop config ----------------
async function getShopConfig() {
  const data = check(
    await supabase.from('shop_config').select('*').eq('id', 'main').maybeSingle(),
    'read shop_config'
  );
  if (!data) return { settings: { ...DEFAULT_SETTINGS }, categories: ['ทั้งหมด', 'ทั่วไป'] };
  return {
    settings: {
      shopName: data.shop_name || DEFAULT_SETTINGS.shopName,
      tagline: data.tagline || DEFAULT_SETTINGS.tagline,
      announcement: data.announcement || DEFAULT_SETTINGS.announcement,
      adminPin: data.admin_pin || DEFAULT_SETTINGS.adminPin,
      socials: data.socials || DEFAULT_SETTINGS.socials,
      stats: data.stats || DEFAULT_SETTINGS.stats
    },
    categories: data.categories || ['ทั้งหมด', 'ทั่วไป']
  };
}

async function updateShopSettings(s) {
  const row = { id: 'main', updated_at: new Date().toISOString() };
  if (s.shopName !== undefined) row.shop_name = s.shopName;
  if (s.tagline !== undefined) row.tagline = s.tagline;
  if (s.announcement !== undefined) row.announcement = s.announcement;
  if (s.adminPin !== undefined) row.admin_pin = s.adminPin;
  if (s.socials !== undefined) row.socials = s.socials;
  if (s.stats !== undefined) row.stats = s.stats;
  check(await supabase.from('shop_config').upsert(row, { onConflict: 'id' }), 'update settings');
  return (await getShopConfig()).settings;
}

async function updateCategories(categories) {
  check(
    await supabase
      .from('shop_config')
      .upsert({ id: 'main', categories, updated_at: new Date().toISOString() }, { onConflict: 'id' }),
    'update categories'
  );
  return categories;
}

// ---------------- Credits ----------------
async function getCredits({ category, search, sort } = {}) {
  let q = supabase.from('credits').select('*');

  if (category && category !== 'ทั้งหมด') q = q.eq('game', category);

  if (search && search.trim()) {
    // Sanitize and escape search string to prevent breaking PostgREST or() filter
    const s = search.trim().replace(/[%_,'"()\\*]/g, ' ').replace(/\s+/g, ' ').trim();
    if (s) {
      q = q.or(`title.ilike.%${s}%,customer.ilike.%${s}%,description.ilike.%${s}%`);
    }
  }

  if (sort === 'price-high') q = q.order('price', { ascending: false });
  else if (sort === 'price-low') q = q.order('price', { ascending: true });
  else q = q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });

  return check(await q, 'read credits').map(rowToCredit);
}

async function getCreditById(id) {
  const data = check(
    await supabase.from('credits').select('*').eq('id', id).maybeSingle(),
    'read credit'
  );
  return data ? rowToCredit(data) : null;
}

async function createCredit(credit) {
  const data = check(
    await supabase.from('credits').insert(creditToRow(credit)).select().single(),
    'create credit'
  );
  return rowToCredit(data);
}

async function updateCredit(id, updates) {
  const row = creditToRow(updates);
  delete row.id;
  const data = check(
    await supabase.from('credits').update(row).eq('id', id).select().maybeSingle(),
    'update credit'
  );
  return data ? rowToCredit(data) : null;
}

async function deleteCredit(id) {
  const existing = await getCreditById(id);
  check(await supabase.from('credits').delete().eq('id', id), 'delete credit');

  // Best-effort cleanup of images stored in our bucket
  if (existing && existing.images) {
    await deleteImagesFromStorage(existing.images);
  }
  return true;
}

async function togglePinCredit(id) {
  const credit = await getCreditById(id);
  if (!credit) return null;
  const updated = await updateCredit(id, { isPinned: !credit.isPinned });
  return updated.isPinned;
}

// ---------------- Storage ----------------
async function uploadImage(buffer, detectedExt = '.jpg', mimeType = 'image/jpeg') {
  const ext = detectedExt.startsWith('.') ? detectedExt : `.${detectedExt}`;
  const fileName = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  check(
    await supabase.storage.from(BUCKET).upload(fileName, buffer, { contentType: mimeType, upsert: false }),
    'upload image'
  );
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
  return {
    url: publicUrl,
    fileName
  };
}

async function deleteImagesFromStorage(imageUrlsOrNames) {
  if (!Array.isArray(imageUrlsOrNames) || imageUrlsOrNames.length === 0) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const fileNames = imageUrlsOrNames
    .map(item => {
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
      console.warn('Storage cleanup warning:', err.message);
    }
  }
}

// Used at startup to verify the connection actually works.
async function healthCheck() {
  check(await supabase.from('credits').select('id', { head: true, count: 'exact' }), 'health check');
}

// ---------------- Customer Reviews (+1 / -1) ----------------
async function getCustomerReviews() {
  try {
    const { data, error } = await supabase
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data.map(r => ({
        id: r.id,
        type: r.type,
        customerName: r.customer_name,
        message: r.message || '',
        images: r.images || [],
        createdAt: r.created_at
      }));
    }
  } catch (err) {}

  // Fallback to shop_config.stats.customer_reviews
  try {
    const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').maybeSingle();
    if (cfg && cfg.stats && Array.isArray(cfg.stats.customer_reviews)) {
      return cfg.stats.customer_reviews;
    }
  } catch (e) {}

  return [];
}

async function createCustomerReview({ type, customerName, message, images }) {
  const row = {
    id: `rev-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    type: (type === '-1') ? '-1' : '+1',
    customer_name: (customerName && customerName.trim()) ? customerName.trim() : 'ลูกค้าทั่วไป',
    message: (message && message.trim()) ? message.trim() : '',
    images: Array.isArray(images) ? images : [],
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('customer_reviews')
      .insert(row)
      .select()
      .maybeSingle();
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
  } catch (err) {}

  // Fallback to shop_config.stats.customer_reviews
  const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').single();
  const currentStats = (cfg && cfg.stats) || {};
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

async function deleteCustomerReview(id) {
  let imagesToDelete = [];
  try {
    const { data } = await supabase.from('customer_reviews').select('images').eq('id', id).maybeSingle();
    if (data && data.images) imagesToDelete = data.images;
    await supabase.from('customer_reviews').delete().eq('id', id);
  } catch (err) {}

  try {
    const { data: cfg } = await supabase.from('shop_config').select('stats').eq('id', 'main').single();
    if (cfg && cfg.stats && Array.isArray(cfg.stats.customer_reviews)) {
      const target = cfg.stats.customer_reviews.find(r => r.id === id);
      if (target && target.images) imagesToDelete = [...imagesToDelete, ...target.images];
      const filtered = cfg.stats.customer_reviews.filter(r => r.id !== id);
      await supabase.from('shop_config').update({
        stats: { ...cfg.stats, customer_reviews: filtered }
      }).eq('id', 'main');
    }
  } catch (err) {}

  if (imagesToDelete.length > 0) {
    await deleteImagesFromStorage(imagesToDelete);
  }

  return true;
}

module.exports = {
  getShopConfig,
  updateShopSettings,
  updateCategories,
  getCredits,
  getCreditById,
  createCredit,
  updateCredit,
  deleteCredit,
  togglePinCredit,
  uploadImage,
  deleteImagesFromStorage,
  getCustomerReviews,
  createCustomerReview,
  deleteCustomerReview,
  healthCheck
};
