require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('⚡ Supabase client initialized:', SUPABASE_URL);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Local Fallback Helpers
function readLocalDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local DB:', e);
  }
  return {
    settings: {
      shopName: 'SUNFZ',
      tagline: 'รวมหลักฐานและเครดิตการซื้อขายจริง เช็คประวัติได้ที่นี่ 100%',
      announcement: '✨ รวมเครดิตซื้อขายร้าน SUNFZ ซื้อขายปลอดภัย มีหลักฐานทุกรายการ!',
      adminPin: '1234',
      socials: {
        facebook: { label: 'Facebook Fanpage', url: 'https://facebook.com', enabled: true },
        line: { label: 'Line ID: @sunfz', url: 'https://line.me', enabled: true },
        discord: { label: 'Discord Server', url: 'https://discord.gg', enabled: true },
        tiktok: { label: 'TikTok Shop', url: '', enabled: false }
      },
      stats: {
        ratingScore: '5.0',
        totalOrders: 'เครดิตจริง 100%',
        deliveryRate: 'ส่งไว ปลอดภัย',
        responseTime: 'ไม่กี่นาที',
        warrantyPeriod: 'มีประกัน'
      }
    },
    categories: ['ทั้งหมด', 'ทั่วไป', 'ไอดีเกม', 'แอพพรีเมียม', 'เติมเกม'],
    credits: []
  };
}

function writeLocalDB(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error('Error writing local DB:', e);
  }
}

// -------------------------------------------------------------
// SHOP CONFIG (Settings + Categories)
// -------------------------------------------------------------
async function getShopConfig() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('shop_config')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();

      if (!error && data) {
        return {
          settings: {
            shopName: data.shop_name || 'SUNFZ',
            tagline: data.tagline || '',
            announcement: data.announcement || '',
            adminPin: data.admin_pin || '1234',
            socials: data.socials || {},
            stats: data.stats || {}
          },
          categories: data.categories || ['ทั้งหมด', 'ทั่วไป']
        };
      }
    } catch (err) {
      console.warn('Supabase getShopConfig error, using fallback:', err.message);
    }
  }

  const local = readLocalDB();
  return {
    settings: local.settings,
    categories: local.categories
  };
}

async function updateShopSettings(newSettings) {
  const local = readLocalDB();
  local.settings = { ...local.settings, ...newSettings };
  writeLocalDB(local);

  if (supabase) {
    try {
      const payload = {
        id: 'main',
        updated_at: new Date().toISOString()
      };
      if (newSettings.shopName !== undefined) payload.shop_name = newSettings.shopName;
      if (newSettings.tagline !== undefined) payload.tagline = newSettings.tagline;
      if (newSettings.announcement !== undefined) payload.announcement = newSettings.announcement;
      if (newSettings.adminPin !== undefined) payload.admin_pin = newSettings.adminPin;
      if (newSettings.socials !== undefined) payload.socials = newSettings.socials;
      if (newSettings.stats !== undefined) payload.stats = newSettings.stats;

      await supabase.from('shop_config').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase updateShopSettings error:', err.message);
    }
  }

  return local.settings;
}

async function updateCategories(categories) {
  const local = readLocalDB();
  local.categories = categories;
  writeLocalDB(local);

  if (supabase) {
    try {
      await supabase
        .from('shop_config')
        .upsert({ id: 'main', categories, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase updateCategories error:', err.message);
    }
  }

  return categories;
}

// -------------------------------------------------------------
// CREDITS
// -------------------------------------------------------------
async function getCredits({ category, search, sort } = {}) {
  if (supabase) {
    try {
      let query = supabase.from('credits').select('*');

      if (category && category !== 'ทั้งหมด') {
        query = query.eq('game', category);
      }

      if (search && search.trim() !== '') {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,customer.ilike.%${q}%,description.ilike.%${q}%`);
      }

      if (sort === 'price-high') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'price-low') {
        query = query.order('price', { ascending: true });
      } else {
        query = query
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          title: item.title,
          game: item.game,
          price: Number(item.price),
          customer: item.customer,
          rating: item.rating,
          date: item.date,
          timeAgo: item.time_ago,
          images: item.images || [],
          description: item.description,
          isPinned: item.is_pinned,
          createdAt: item.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase getCredits error, using local fallback:', err.message);
    }
  }

  // Local fallback
  const local = readLocalDB();
  let credits = [...(local.credits || [])];

  if (category && category !== 'ทั้งหมด') {
    credits = credits.filter(c => c.game === category);
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    credits = credits.filter(c =>
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.customer && c.customer.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.price && c.price.toString().includes(q))
    );
  }

  if (sort === 'price-high') {
    credits.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sort === 'price-low') {
    credits.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else {
    credits.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    });
  }

  return credits;
}

async function getCreditById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          game: data.game,
          price: Number(data.price),
          customer: data.customer,
          rating: data.rating,
          date: data.date,
          timeAgo: data.time_ago,
          images: data.images || [],
          description: data.description,
          isPinned: data.is_pinned,
          createdAt: data.created_at
        };
      }
    } catch (err) {
      console.warn('Supabase getCreditById error:', err.message);
    }
  }

  const local = readLocalDB();
  return (local.credits || []).find(c => c.id === id) || null;
}

async function createCredit(creditData) {
  const local = readLocalDB();
  if (!local.credits) local.credits = [];
  local.credits.unshift(creditData);
  writeLocalDB(local);

  if (supabase) {
    try {
      await supabase.from('credits').insert({
        id: creditData.id,
        title: creditData.title,
        game: creditData.game,
        price: creditData.price,
        customer: creditData.customer,
        rating: creditData.rating,
        date: creditData.date,
        time_ago: creditData.timeAgo,
        images: creditData.images,
        description: creditData.description,
        is_pinned: creditData.isPinned,
        created_at: creditData.createdAt
      });
    } catch (err) {
      console.warn('Supabase createCredit error:', err.message);
    }
  }

  return creditData;
}

async function updateCredit(id, updates) {
  const local = readLocalDB();
  const index = (local.credits || []).findIndex(c => c.id === id);
  if (index !== -1) {
    local.credits[index] = { ...local.credits[index], ...updates };
    writeLocalDB(local);
  }

  if (supabase) {
    try {
      const dbPayload = {};
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.game !== undefined) dbPayload.game = updates.game;
      if (updates.price !== undefined) dbPayload.price = updates.price;
      if (updates.customer !== undefined) dbPayload.customer = updates.customer;
      if (updates.rating !== undefined) dbPayload.rating = updates.rating;
      if (updates.date !== undefined) dbPayload.date = updates.date;
      if (updates.images !== undefined) dbPayload.images = updates.images;
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.isPinned !== undefined) dbPayload.is_pinned = updates.isPinned;

      await supabase.from('credits').update(dbPayload).eq('id', id);
    } catch (err) {
      console.warn('Supabase updateCredit error:', err.message);
    }
  }

  return index !== -1 ? local.credits[index] : null;
}

async function deleteCredit(id) {
  const local = readLocalDB();
  const item = (local.credits || []).find(c => c.id === id);
  local.credits = (local.credits || []).filter(c => c.id !== id);
  writeLocalDB(local);

  if (supabase) {
    try {
      await supabase.from('credits').delete().eq('id', id);
      
      // Delete images from Supabase storage if applicable
      if (item && item.images && Array.isArray(item.images)) {
        for (const imgUrl of item.images) {
          if (imgUrl.includes('/storage/v1/object/public/credit-images/')) {
            const fileName = imgUrl.split('/credit-images/')[1];
            if (fileName) {
              await supabase.storage.from('credit-images').remove([fileName]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase deleteCredit error:', err.message);
    }
  }

  return true;
}

async function togglePinCredit(id) {
  const credit = await getCreditById(id);
  if (!credit) return null;
  const newPinned = !credit.isPinned;
  await updateCredit(id, { isPinned: newPinned });
  return newPinned;
}

// -------------------------------------------------------------
// STORAGE (Upload images to Supabase Bucket 'credit-images')
// -------------------------------------------------------------
async function uploadImageToSupabase(fileBuffer, originalName, mimeType) {
  if (!supabase) return null;

  try {
    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const fileName = `credit-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('credit-images')
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('credit-images')
      .getPublicUrl(fileName);

    return data ? data.publicUrl : null;
  } catch (err) {
    console.error('uploadImageToSupabase exception:', err);
    return null;
  }
}

module.exports = {
  supabase,
  getShopConfig,
  updateShopSettings,
  updateCategories,
  getCredits,
  getCreditById,
  createCredit,
  updateCredit,
  deleteCredit,
  togglePinCredit,
  uploadImageToSupabase,
  readLocalDB,
  writeLocalDB
};
