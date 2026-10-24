-- =============================================
-- SQL SCHEMA FOR SUPABASE (MY-CREDITS / SUNFZENITH)
-- คัดลอกโค้ดทั้งหมดนี้ไปวางในหน้า Supabase -> SQL Editor แล้วกด RUN
-- =============================================

-- 1. ตารางตั้งค่าร้านค้า (Settings & Categories)
CREATE TABLE IF NOT EXISTS public.shop_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    shop_name TEXT NOT NULL DEFAULT 'SUNFZENITH',
    tagline TEXT DEFAULT 'Small Dream, Big Zenith',
    announcement TEXT DEFAULT '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอสร้างสรรค์งานดิจิทัล เว็บไซต์ และดีไซน์',
    admin_pin_hash TEXT,
    socials JSONB DEFAULT '{"facebook":{"label":"Facebook Page","url":"https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH","enabled":true},"line":{"label":"LINE OA: @419ajynp","url":"https://line.me/R/ti/p/@419ajynp","enabled":true},"discord":{"label":"Discord Server","url":"","enabled":false},"tiktok":{"label":"TikTok","url":"","enabled":false}}'::jsonb,
    stats JSONB DEFAULT '{"ratingScore":"5.0","totalOrders":"ผลงานคุณภาพ 100%","deliveryRate":"ส่งตรงเวลา ใส่ใจทุกรายละเอียด","responseTime":"ตอบกลับรวดเร็ว","warrantyPeriod":"ดูแลหลังส่งมอบ"}'::jsonb,
    categories JSONB DEFAULT '["ทั้งหมด", "ทั่วไป", "เว็บไซต์", "สไลด์", "ดีไซน์"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางรายการเครดิตการซื้อขาย (Credits)
CREATE TABLE IF NOT EXISTS public.credits (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    game TEXT NOT NULL DEFAULT 'ทั่วไป',
    price NUMERIC NOT NULL DEFAULT 0,
    customer TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    date TEXT,
    time_ago TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง Index เพื่อให้โหลดเร็ว
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON public.credits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_is_pinned ON public.credits (is_pinned DESC);
CREATE INDEX IF NOT EXISTS idx_credits_game ON public.credits (game);

-- 3. ค่าเริ่มต้นร้านค้า (ไม่มี PIN ฝังตายตัว ให้กำหนดผ่าน ADMIN_PIN หรือหน้า Admin)
INSERT INTO public.shop_config (id, shop_name, tagline, announcement, categories, socials, stats)
VALUES (
    'main',
    'SUNFZENITH',
    'Small Dream, Big Zenith',
    '✨ ยินดีต้อนรับสู่ SUNFZENITH สตูดิโอสร้างสรรค์งานดิจิทัล เว็บไซต์ และดีไซน์',
    '["ทั้งหมด", "ทั่วไป", "เว็บไซต์", "สไลด์", "ดีไซน์"]'::jsonb,
    '{"facebook":{"label":"Facebook Page","url":"https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH","enabled":true},"line":{"label":"LINE OA: @419ajynp","url":"https://line.me/R/ti/p/@419ajynp","enabled":true},"discord":{"label":"Discord Server","url":"","enabled":false},"tiktok":{"label":"TikTok","url":"","enabled":false}}'::jsonb,
    '{"ratingScore":"5.0","totalOrders":"ผลงานคุณภาพ 100%","deliveryRate":"ส่งตรงเวลา ใส่ใจทุกรายละเอียด","responseTime":"ตอบกลับรวดเร็ว","warrantyPeriod":"ดูแลหลังส่งมอบ"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. ตารางรีวิวจากลูกค้า (+1 และ -1 พร้อมหลักฐาน)
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT '+1', -- '+1' หรือ '-1'
    customer_name TEXT NOT NULL,
    message TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_created ON public.customer_reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_type ON public.customer_reviews (type);

-- 5. ตั้งค่าสิทธิ์ความปลอดภัย (Row Level Security - RLS)
-- ตาราง shop_config: เปิด RLS และไม่อนุญาต Anonymous Direct Query เพื่อป้องกัน credential leak
-- (ฝั่ง Public อ่านผ่าน Server API /api/public/settings ซึ่งผ่านการกรองข้อมูลแล้ว)
ALTER TABLE public.shop_config ENABLE ROW LEVEL SECURITY;

-- ตาราง credits: เปิด RLS อนุญาตเฉพาะ Public Read (SELECT)
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on credits" ON public.credits;
CREATE POLICY "Allow public read on credits" ON public.credits FOR SELECT USING (true);

-- ตาราง customer_reviews: เปิด RLS อนุญาตเฉพาะ Public Read (SELECT)
-- (การส่งรีวิวใหม่ต้องส่งผ่าน Server API เพื่อตรวจสอบไฟล์และป้องกัน spam)
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on customer_reviews" ON public.customer_reviews;
CREATE POLICY "Allow public read on customer_reviews" ON public.customer_reviews FOR SELECT USING (true);

-- 6. Storage Bucket สำหรับรูปภาพ (credit-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-images', 'credit-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- อนุญาตเฉพาะการดูรูปภาพผ่าน Public CDN (ห้าม Anonymous Upload/Update/Delete)
DROP POLICY IF EXISTS "Public bucket view" ON storage.objects;
CREATE POLICY "Public bucket view" ON storage.objects FOR SELECT USING (bucket_id = 'credit-images');
