-- =============================================
-- SQL SCHEMA FOR SUPABASE (MY-CREDITS / SUNFZ)
-- คัดลอกโค้ดทั้งหมดนี้ไปวางในหน้า Supabase -> SQL Editor แล้วกด RUN
-- =============================================

-- 1. ตารางตั้งค่าร้านค้า (Settings & Categories)
CREATE TABLE IF NOT EXISTS public.shop_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    shop_name TEXT NOT NULL DEFAULT 'SUNFZ',
    tagline TEXT DEFAULT 'รวมหลักฐานและเครดิตการซื้อขายจริง เช็คประวัติได้ที่นี่ 100%',
    announcement TEXT DEFAULT '✨ รวมเครดิตซื้อขายร้าน SUNFZ ซื้อขายปลอดภัย มีหลักฐานทุกรายการ!',
    admin_pin TEXT DEFAULT '1234',
    socials JSONB DEFAULT '{"facebook":{"label":"Facebook Fanpage","url":"https://facebook.com","enabled":true},"line":{"label":"Line ID: @sunfz","url":"https://line.me","enabled":true},"discord":{"label":"Discord Server","url":"https://discord.gg","enabled":true},"tiktok":{"label":"TikTok Shop","url":"","enabled":false}}'::jsonb,
    stats JSONB DEFAULT '{"ratingScore":"5.0","totalOrders":"เครดิตจริง 100%","deliveryRate":"ส่งไว ปลอดภัย","responseTime":"ไม่กี่นาที","warrantyPeriod":"มีประกัน"}'::jsonb,
    categories JSONB DEFAULT '["ทั้งหมด", "ทั่วไป", "ไอดีเกม", "แอพพรีเมียม", "เติมเกม"]'::jsonb,
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

-- 3. ข้อมูลเริ่มต้น (Initial Data)
INSERT INTO public.shop_config (id, shop_name, tagline, announcement, admin_pin, categories)
VALUES ('main', 'SUNFZ', 'รวมหลักฐานและเครดิตการซื้อขายจริง เช็คประวัติได้ที่นี่ 100%', '✨ รวมเครดิตซื้อขายร้าน SUNFZ ซื้อขายปลอดภัย มีหลักฐานทุกรายการ!', '1234', '["ทั้งหมด", "ทั่วไป", "ไอดีเกม", "แอพพรีเมียม", "เติมเกม"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.credits (id, title, game, price, customer, rating, date, time_ago, images, description, is_pinned, created_at)
VALUES 
(
    'sample-1',
    'ไอดี Genshin Impact C6 Furina + Sign R1 & 24 ตัว 5 ดาว',
    'ไอดีเกม',
    4500,
    'คุณธนภัทร',
    5,
    '2026-10-03',
    '10 นาทีที่แล้ว',
    '["/images/sample-genshin.svg"]'::jsonb,
    'ส่งมอบเรียบร้อย ลูกค้าเช็คไอดีถูกต้อง โอนเงินไวมากครับ ขอบคุณที่ไว้วางใจ!',
    true,
    '2026-10-03T03:50:40.631Z'
),
(
    'sample-2',
    'บัญชีพรีเมียม 1 ปี ใช้งานได้ยาวๆ ไม่หลุด',
    'แอพพรีเมียม',
    490,
    'คุณนนท์',
    5,
    '2026-10-03',
    '2 ชม. ที่แล้ว',
    '["/images/sample-starrail.svg"]'::jsonb,
    'ส่งเมลและรหัสให้เรียบร้อย ล็อกอินผ่านฉลุย ขอบคุณครับ',
    true,
    '2026-10-03T01:50:40.631Z'
),
(
    'sample-3',
    'เติมแพ็กรายเดือน / เติมเกมส่งไว',
    'เติมเกม',
    179,
    'คุณกอล์ฟ',
    5,
    '2026-10-02',
    'เมื่อวานนี้',
    '["/images/sample-genshin.svg"]'::jsonb,
    'โอนปุ๊บเติมปั๊บ เข้าทันทีภายใน 2 นาทีครับ',
    false,
    '2026-10-02T10:30:00.000Z'
)
ON CONFLICT (id) DO NOTHING;

-- 4. ตั้งค่าสิทธิ์ความปลอดภัย (Row Level Security - RLS)
ALTER TABLE public.shop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ทุกคนสามารถอ่านข้อมูลได้ (Public Read)
CREATE POLICY "Allow public read on shop_config" ON public.shop_config FOR SELECT USING (true);
CREATE POLICY "Allow public read on credits" ON public.credits FOR SELECT USING (true);

-- อนุญาตให้ระบบแก้ไขได้ (Service Role หรือ Full access)
CREATE POLICY "Allow all access on shop_config" ON public.shop_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on credits" ON public.credits FOR ALL USING (true) WITH CHECK (true);

-- 5. สร้าง Storage Bucket สำหรับรูปภาพ (credit-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-images', 'credit-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- อนุญาตให้ทุกคนดูรูปใน Bucket ได้
CREATE POLICY "Public bucket view" ON storage.objects FOR SELECT USING (bucket_id = 'credit-images');
CREATE POLICY "Public bucket upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'credit-images');
CREATE POLICY "Public bucket modify" ON storage.objects FOR UPDATE USING (bucket_id = 'credit-images');
CREATE POLICY "Public bucket delete" ON storage.objects FOR DELETE USING (bucket_id = 'credit-images');

-- 6. ตารางรีวิวจากลูกค้า (+1 และ -1 พร้อมหลักฐาน)
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

ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on customer_reviews" ON public.customer_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customer_reviews" ON public.customer_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all access on customer_reviews" ON public.customer_reviews FOR ALL USING (true) WITH CHECK (true);
