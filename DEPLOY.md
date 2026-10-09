# คู่มือการนำเว็บขึ้นออนไลน์ 24 ชม. และการตั้งค่าความปลอดภัย (Deploy Guide)

ระบบเว็บเครดิตนี้เชื่อมต่อกับ **Supabase** (Database + Storage) ทำให้ข้อมูลและรูปภาพทั้งหมดอยู่ถาวร 100% ไม่สูญหายเมื่อเซิร์ฟเวอร์รีสตาร์ท

---

## ขั้นตอนที่ 1: ติดตั้งตารางใน Supabase

### กรณีที่ 1: ติดตั้งใหม่ครั้งแรก (New Setup)
1. ไปที่แดชบอร์ด [Supabase](https://supabase.com/dashboard) เลือกโปรเจกต์ของคุณ
2. ที่เมนูด้านซ้าย คลิกไอคอน **SQL Editor** (รูป `>_`)
3. กดปุ่ม **+ New query**
4. คัดลอกโค้ดทั้งหมดในไฟล์ `supabase_schema.sql` ไปวาง
5. กดปุ่ม **RUN** (สีเขียวขวาล่าง)
   - ระบบจะสร้างตาราง `shop_config`, `credits`, `customer_reviews` และ Storage Bucket `credit-images` พร้อมตั้งค่า Row Level Security (RLS) อย่างปลอดภัย

### กรณีที่ 2: อัปเกรดฐานข้อมูลเดิมที่ใช้งานอยู่แล้ว (Security Migration)
1. ไปที่แดชบอร์ด **Supabase** -> **SQL Editor**
2. คัดลอกโค้ดจากไฟล์ `supabase_security_migration.sql` ไปวางแล้วกด **RUN**
   - สคริปต์นี้เป็นแบบ Idempotent (สามารถรันซ้ำได้อย่างปลอดภัย) จะทำการยกเลิก policy ที่หละหลวม ลบ fallback PIN เก่า และเปิด RLS ป้องกันการเข้าถึง credentials จากภายนอก

---

## ขั้นตอนที่ 2: นำโค้ดเว็บขึ้นออนไลน์บน Render.com

1. นำโค้ดโปรเจกต์นี้อัปโหลดขึ้น **GitHub Repository** ของคุณ (Private หรือ Public ก็ได้)
2. สมัครใช้งานฟรีที่ [Render.com](https://render.com) (ล็อกอินด้วย GitHub)
3. ที่หน้า Dashboard Render คลิก **New +** -> เลือก **Web Service**
4. เชื่อมต่อกับ Repository ที่อัปโหลดไว้
5. ตั้งค่าดังนี้:
   - **Name:** `sunfz-credits` (หรือชื่อตามต้องการ)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
6. เลื่อนลงมาที่หัวข้อ **Environment Variables** -> กด **Add Environment Variable** และระบุค่าดังต่อไปนี้:

| Environment Variable | คำอธิบาย | ตัวอย่าง / วิธีสร้าง |
|----------------------|---------|---------------------|
| `NODE_ENV` | โหมดการทำงาน | `production` |
| `SESSION_SECRET` | คีย์เข้ารหัสเซสชัน (**จำเป็นต้องมีความยาวอย่างน้อย 32 ตัวอักษร**) หากไม่ตั้งค่าหรือสั้นเกินไป ระบบจะหยุดทำงานทันทีเพื่อความปลอดภัย | สร้างด้วยคำสั่ง terminal: `openssl rand -base64 32` |
| `ADMIN_PIN` | รหัส PIN เริ่มต้นสำหรับแอดมิน (ห้ามใช้ 1234 หรือ 3645) | ตั้งรหัสผ่านที่ปลอดภัย เช่น `782914` |
| `SUPABASE_URL` | Project URL จากหน้า Settings -> API ใน Supabase | `https://your-project-id.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Secret Key (สำหรับ Backend Server เท่านั้น **ห้ามใช้ Anon Key**) | ได้จาก Supabase -> Settings -> API -> Project API keys (service_role secret) |

7. กด **Create Web Service** -> รอระบบ Deploy ประมาณ 1-2 นาที
8. คุณจะได้ลิงก์เว็บจริงทันที เช่น `https://sunfz-credits.onrender.com` ใช้งานได้ตลอด 24 ชม.

---

## ขั้นตอนการหมุนเวียนคีย์ (Secret Rotation Guide)

การเปลี่ยน `SESSION_SECRET` เป็นประจำหรือเมื่อสงสัยว่ามีความเสี่ยง ควรปฏิบัติตามขั้นตอนนี้:

1. **สร้าง Secret ใหม่ที่มีความปลอดภัยสูง:**
   รันคำสั่งในเทอร์มินัลของคุณ:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   *(จะได้สตริงสุ่มความยาว 64 ตัวอักษร)*
2. **อัปเดตในระบบ Hosting (เช่น Render Dashboard):**
   - ไปที่แดชบอร์ด Web Service ของคุณบน Render
   - เข้าเมนู **Environment**
   - แก้ไขค่า `SESSION_SECRET` ด้วยค่าที่สร้างใหม่ในขั้นตอนที่ 1
   - กด **Save Changes**
3. **ผลกระทบจากการ Rotate:**
   - เซิร์ฟเวอร์จะ Restart อัตโนมัติและใช้งาน Secret ใหม่ทันที
   - เซสชันแอดมินเดิมทั้งหมดที่ค้างอยู่จะถูกยกเลิก (Invalidated) โดยอัตโนมัติ เพื่อความปลอดภัย
   - แอดมินเพียงแค่ล็อกอินใหม่อีกครั้งด้วย PIN เดิม

---

## วิธีทางเลือก: แชร์ลิงก์ออนไลน์ชั่วคราวจากเครื่องคุณ (Cloudflare Tunnel)

รันคำสั่งนี้เพื่อรับลิงก์ HTTPS ตรงทันทีโดยไม่ต้อง Deploy:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

---

## ลิงก์สำหรับใช้งาน

- **หน้าร้านค้า SUNFZ (สำหรับส่งให้ลูกค้าดูเครดิต):** `https://your-domain.com/`
- **แผงจัดการแอดมินร้าน SUNFZ:** `https://your-domain.com/admin` (ล็อกอินด้วยรหัส PIN ที่ระบุใน `ADMIN_PIN`)
