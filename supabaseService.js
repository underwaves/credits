// Data layer: Supabase only.
// There is intentionally NO local-file fallback. On hosts like Render the disk is
// wiped on every restart, so a silent fallback would make data disappear.
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

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

// Throw on any Supabase error so routes return 500 instead of pretending success.
function check({ data, error }, action) {
  if (error) throw new Error(`Supabase ${action}: ${error.message}`);
  return data;
}

const DEFAULT_SETTINGS = {
  shopName: 'SUNFZ',
  tagline: '',
  announcement: '',
  adminPin: '1234',
  socials: {},
  stats: {}
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
      tagline: data.tagline || '',
      announcement: data.announcement || '',
      adminPin: data.admin_pin || DEFAULT_SETTINGS.adminPin,
      socials: data.socials || {},
      stats: data.stats || {}
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
    // Strip characters that would break PostgREST's or() filter syntax.
    const s = search.trim().replace(/[,()%*]/g, ' ');
    q = q.or(`title.ilike.%${s}%,customer.ilike.%${s}%,description.ilike.%${s}%`);
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

  // Best-effort cleanup of images stored in our bucket.
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const files = (existing?.images || [])
    .filter(u => typeof u === 'string' && u.includes(marker))
    .map(u => u.split(marker)[1]);
  if (files.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(files);
    if (error) console.warn('ลบรูปใน Storage ไม่สำเร็จ:', error.message);
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
async function uploadImage(buffer, originalName, mimeType) {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const fileName = `credit-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  check(
    await supabase.storage.from(BUCKET).upload(fileName, buffer, { contentType: mimeType }),
    'upload image'
  );
  return supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
}

// Used at startup to verify the connection actually works.
async function healthCheck() {
  check(await supabase.from('credits').select('id', { head: true, count: 'exact' }), 'health check');
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
  healthCheck
};
