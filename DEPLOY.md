# คู่มือการนำเว็บขึ้นออนไลน์ 24 ชม. (Deploy Guide)

ระบบเว็บเครดิตนี้สร้างด้วย Node.js + Express สามารถนำขึ้นออนไลน์ได้ทั้งแบบ **แชร์ลิงก์ทดสอบทันที** และ **เปิดออนไลน์ 24 ชม. ฟรีตลอดชีพ**

---

## วิธีที่ 1: แชร์ลิงก์ออนไลน์ทันที (Cloudflare Tunnel - เร็วและตรงที่สุด)

สามารถรันคำสั่งนี้เพื่อรับลิงก์ HTTPS ตรง โดยไม่มีหน้าถามรหัสผ่าน:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

---

## วิธีที่ 2: นำขึ้นออนไลน์ 24 ชม. ฟรีบน Render.com (แนะนำที่สุด)

ไม่ต้องเปิดคอมทิ้งไว้ เว็บจะออนไลน์ตลอด 24 ชม. ฟรี:

1. สมัครใช้งานฟรีที่ [Render.com](https://render.com) (ล็อกอินด้วย GitHub หรือ Google)
2. นำโฟลเดอร์โปรเจกต์นี้อัปโหลดขึ้น GitHub Repository ของคุณ (ตั้งเป็น Public หรือ Private ก็ได้)
3. ที่หน้าแดชบอร์ด Render คลิก **New +** -> เลือก **Web Service**
4. เชื่อมต่อกับ Repository ที่อัปโหลดไว้
5. ตั้งค่าตามนี้:
   - **Name:** `sunfz-credits` (หรือชื่ออะไรก็ได้ตามใจชอบ)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
6. กด **Create Web Service** -> รอระบบ Build ประมาณ 1-2 นาที
7. คุณจะได้ลิงก์เว็บจริงทันที เช่น `https://sunfz-credits.onrender.com` ใช้งานได้ตลอด 24 ชม.!

---

## โครงสร้างลิงก์สำหรับใช้งาน

- **หน้าร้านค้า SUNFZ (สำหรับส่งให้ลูกค้าดูเครดิต):** `https://your-domain.com/`
- **แผงจัดการแอดมินร้าน SUNFZ (เข้าด้วย PIN):** `https://your-domain.com/admin`
