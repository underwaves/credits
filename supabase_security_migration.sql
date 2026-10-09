-- ========================================================
-- SUNFZENITH Security Hardening Migration for Supabase
-- Idempotent Migration: Safe to run multiple times on any schema
-- ========================================================

-- 1. Ensure admin_pin_hash column exists on shop_config
ALTER TABLE IF EXISTS public.shop_config
  ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT;

-- 2. Safely handle legacy admin_pin column if it exists in the database
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_config'
      AND column_name = 'admin_pin'
  ) THEN
    -- Drop dangerous plaintext default PIN constraint
    EXECUTE 'ALTER TABLE public.shop_config ALTER COLUMN admin_pin DROP DEFAULT';

    -- Clear insecure default fallback PINs ('1234', '3645') from existing records
    EXECUTE 'UPDATE public.shop_config SET admin_pin = NULL WHERE admin_pin IN (''1234'', ''3645'')';
  END IF;
END $$;

-- 3. Drop all insecure "FOR ALL" and write/update/delete policies on all public tables
DROP POLICY IF EXISTS "Allow all access on shop_config" ON public.shop_config;
DROP POLICY IF EXISTS "Allow public read on shop_config" ON public.shop_config;
DROP POLICY IF EXISTS "Allow public write on shop_config" ON public.shop_config;
DROP POLICY IF EXISTS "Allow public insert on shop_config" ON public.shop_config;
DROP POLICY IF EXISTS "Allow public update on shop_config" ON public.shop_config;
DROP POLICY IF EXISTS "Allow public delete on shop_config" ON public.shop_config;

DROP POLICY IF EXISTS "Allow all access on credits" ON public.credits;
DROP POLICY IF EXISTS "Allow public write on credits" ON public.credits;
DROP POLICY IF EXISTS "Allow public insert on credits" ON public.credits;
DROP POLICY IF EXISTS "Allow public update on credits" ON public.credits;
DROP POLICY IF EXISTS "Allow public delete on credits" ON public.credits;

DROP POLICY IF EXISTS "Allow all access on customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Allow public write on customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Allow public insert on customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Allow public update on customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Allow public delete on customer_reviews" ON public.customer_reviews;

-- 4. Enable RLS on all tables
-- shop_config: No public access granted. Public queries go through Server API (/api/public/settings) which filters secrets.
ALTER TABLE IF EXISTS public.shop_config ENABLE ROW LEVEL SECURITY;

-- credits: Public SELECT only (Service Role performs mutations)
ALTER TABLE IF EXISTS public.credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on credits" ON public.credits;
CREATE POLICY "Allow public read on credits" ON public.credits
  FOR SELECT USING (true);

-- customer_reviews: Public SELECT only (Server API handles review submission, validation & spam checks)
ALTER TABLE IF EXISTS public.customer_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on customer_reviews" ON public.customer_reviews;
CREATE POLICY "Allow public read on customer_reviews" ON public.customer_reviews
  FOR SELECT USING (true);

-- 5. Secure Storage (credit-images bucket)
-- Ensure bucket exists and is public for direct CDN image loading
INSERT INTO storage.buckets (id, name, public)
VALUES ('credit-images', 'credit-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove any anonymous/public upload, modify, or delete policies on storage.objects
DROP POLICY IF EXISTS "Public bucket upload" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket modify" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on credit-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on credit-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on credit-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all on credit-images" ON storage.objects;

-- Ensure public can ONLY view images (SELECT only)
DROP POLICY IF EXISTS "Public bucket view" ON storage.objects;
CREATE POLICY "Public bucket view" ON storage.objects
  FOR SELECT USING (bucket_id = 'credit-images');
