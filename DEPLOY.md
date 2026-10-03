# คู่มือการนำเว็บขึ้นออนไลน์ 24 ชม. ร่วมกับ Supabase (Deploy Guide)

ระบบเว็บเครดิตนี้เชื่อมต่อกับ **Supabase** (Database + Storage) ทำให้ข้อมูลและรูปภาพทั้งหมดอยู่ถาวร 100% ไม่สูญหายเมื่อเซิร์ฟเวอร์รีสตาร์ท

---

## ขั้นตอนที่ 1: ติดตั้งตารางใน Supabase (ทำครั้งเดียว)

1. ไปที่แดชบอร์ด [Supabase](https://supabase.com/dashboard) เลือกโปรเจกต์ของคุณ
2. ที่เมนูด้านซ้าย คลิกไอคอน **SQL Editor** (รูป `>_`)
3. กดปุ่ม **+ New query**
4. คัดลอกโค้ดทั้งหมดในไฟล์ `supabase_schema.sql` ไปวาง
5. กดปุ่ม **RUN** (สีเขียวขวาล่าง)
   - ระบบจะสร้างตาราง `shop_config`, `credits` พร้อมสร้าง Storage Bucket `credit-images` ให้อัตโนมัติ

---

## ขั้นตอนที่ 2: นำโค้ดเว็บขึ้นออนไลน์ 24 ชม. ฟรีบน Render.com

1. นำโค้ดโปรเจกต์นี้อัปโหลดขึ้น **GitHub Repository** ของคุณ
2. สมัครใช้งานฟรีที่ [Render.com](https://render.com) (ล็อกอินด้วย GitHub)
3. ที่หน้า Dashboard Render คลิก **New +** -> เลือก **Web Service**
4. เชื่อมต่อกับ Repository ที่อัปโหลดไว้
5. ตั้งค่าตามนี้:
   - **Name:** `sunfz-credits` (หรือชื่ออะไรก็ได้)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
6. เลื่อนลงมาที่หัวข้อ **Environment Variables** -> กด **Add Environment Variable** แล้วใส่:
   - `SUPABASE_URL` = `https://nerdcpkimkivneshypqm.supabase.co`
   - `SUPABASE_KEY` = `sb_publishable_4ceDnV7GO1F1zKUveyAj_Q_uXFosVLu`
   - `SESSION_SECRET` = `my-super-secret-game-credits-key-2026`
7. กด **Create Web Service** -> รอระบบ Deploy ประมาณ 1-2 นาที
8. คุณจะได้ลิงก์เว็บจริงทันที เช่น `https://sunfz-credits.onrender.com` ใช้งานได้ตลอด 24 ชม.!

---

## วิธีทางเลือก: แชร์ลิงก์ออนไลน์ทันทีจากเครื่องคุณ (Cloudflare Tunnel)

รันคำสั่งนี้เพื่อรับลิงก์ HTTPS ตรงทันทีโดยไม่ต้อง Deploy:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

---

## โครงสร้างลิงก์สำหรับใช้งาน

- **หน้าร้านค้า SUNFZ (สำหรับส่งให้ลูกค้าดูเครดิต):** `https://your-domain.com/`
- **แผงจัดการแอดมินร้าน SUNFZ (เข้าด้วย PIN):** `https://your-domain.com/admin` (PIN เริ่มต้น: `1234`)
