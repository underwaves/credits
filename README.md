<div align="center">

  <img src="public/images/logo.svg" alt="SUNFZ Logo" width="80" height="80">

  # SUNFZENITH — Full-stack Portfolio & Credit Verification Web Application

  **เว็บไซต์นำเสนอผลงานและระบบรวมเครดิต/รีวิวพร้อมหลักฐาน สำหรับสร้างความน่าเชื่อถือให้ธุรกิจดิจิทัล**

  [![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
  [![Express](https://img.shields.io/badge/Express-v5.0-000000?logo=express&logoColor=white)](https://expressjs.com)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/underwaves)

  <p align="center">
    <a href="#-overview">Overview</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-architecture--design">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-admin-guide">Admin Guide</a> •
    <a href="#-deployment">Deployment</a>
  </p>

</div>

---

## 📖 Overview

**SUNFZENITH** เป็นเว็บแอปแบบ Full-stack สำหรับนำเสนอบริการและ Portfolio ควบคู่กับระบบเครดิต/รีวิวพร้อมหลักฐาน เหมาะกับร้านค้าออนไลน์หรือผู้ให้บริการดิจิทัลที่ต้องการให้ลูกค้าตรวจสอบประวัติและความน่าเชื่อถือได้

ฐานข้อมูลหลักคือ **Supabase PostgreSQL** และ Supabase Storage สำหรับรูปหลักฐาน โดยมี JSON ในเครื่องเป็น fallback สำหรับการพัฒนาในเครื่องหรือกรณีฐานข้อมูลยังไม่ได้ตั้งค่าเท่านั้น

### 💡 Core Design Principles
- **Separated Experiences:** หน้าสาธารณะ (`/` และ `/credits`) ใช้สำหรับดูข้อมูลและส่งรีวิว ส่วนการจัดการข้อมูลทั้งหมดอยู่ใน `/admin` เท่านั้น
- **Dedicated Admin Studio:** Store administrators manage everything exclusively through a PIN-protected, standalone web app portal (`/admin`).
- **Proof-First Cards:** High-resolution screenshots take center stage with responsive aspect ratios, zoomable lightboxes, and one-click deep-link sharing.

---

## ✨ Key Features

### 🌐 Public Website (`/` และ `/credits`)
- **Brand & Portfolio Website:** แสดงบริการ ราคา ขั้นตอนทำงาน และผลงานแบบ responsive
- **Credit & Review Feed:** แสดงเครดิตพร้อมรูปหลักฐาน ราคา ลูกค้า วันที่ ค้นหา และปักหมุดรายการสำคัญ
- **Interactive Lightbox:** เปิดดูรูปเต็ม, เลื่อนดูหลายรูป, ซูม และเปิดลิงก์เฉพาะเครดิตได้
- **Customer Reviews:** ส่งรีวิว `+1` หรือรายงาน `-1` พร้อมหลักฐานรูปภาพ
- **SEO Basics:** มี `robots.txt`, `sitemap.xml` และหน้า 404

### 🛡️ Dedicated Admin Studio (`/admin`)
- **PIN Lock Authentication:** PIN ที่ hash ด้วย scrypt, session ที่ลงลายเซ็น HMAC และ HttpOnly cookie
- **Drag & Drop Upload:** Multi-file drag-and-drop dropzone supporting up to 5 images per credit (JPG, PNG, WebP) with instant thumbnail removal.
- **Flexible Items Categorization:** "Sell anything" structure — title, price, customer, review note, and pin toggle.
- **One-Click Pinning:** Pin featured items to always appear at the top of the feed.
- **Full CRUD Management:** จัดการเครดิต, Portfolio, บริการ, แพ็กเกจราคา, เนื้อหาเว็บไซต์ และรีวิว
- **Shop Customization:** แก้ชื่อร้าน tagline announcement และ social links
- **Backup:** Export/Import ข้อมูลสำคัญใน JSON โดยไม่รวม PIN หรือ hash ของ PIN

---

## 🏗️ Architecture & Design

```
├── web/                    # Vite frontend: HTML, ES modules, CSS และ assets
├── src/
│   ├── server/             # Express routes, middleware, services และ data fallback
│   └── shared/             # Validation และ sanitization ที่ใช้ร่วมกัน
├── tests/                  # Vitest + Supertest integration/security tests
├── supabase_schema.sql     # ตาราง, index, RLS และ Storage policy
├── supabase_security_migration.sql
├── server.js               # จุดเริ่มต้น Express server
└── package.json            # คำสั่ง build, test และ QA
```

### 🔒 Security Highlights
- **scrypt PIN hashing + constant-time comparison:** ไม่เก็บ PIN เป็น plain text
- **HMAC-SHA256 sessions + HttpOnly/SameSite/Secure cookies:** ลดความเสี่ยงจาก token theft และ session tampering
- **Rate limiting, same-origin guard และ security headers:** ป้องกัน brute-force, CSRF และ browser attacks พื้นฐาน
- **Safe upload handling:** จำกัดไฟล์สูงสุด 5 รูป รูปละ 5 MB และตรวจ magic bytes ของ JPG/PNG/WebP
- **Input validation & sanitization:** จำกัดขนาดข้อมูล, escape HTML และบล็อก URL อันตราย
- **Supabase RLS:** เปิด public read เฉพาะข้อมูลที่เปิดเผยได้ การเขียนทำผ่าน server ที่เก็บ service role key ไว้ใน environment variables

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/) | Lightweight, asynchronous REST API runtime |
| **File Handling** | [Multer](https://github.com/expressjs/multer) | High-speed multi-part form data & disk storage |
| **Frontend** | Vanilla JavaScript (ES6+) | Blazing fast client logic with zero framework overhead |
| **Styling** | [Tailwind CSS CDN](https://tailwindcss.com/) & Custom CSS | Responsive layout following `#F8FAFC` Minimal Trust Palette |
| **Typography** | Google Fonts | Plus Jakarta Sans, Prompt, Noto Sans Thai |
| **Icons** | [Lucide Icons](https://lucide.dev/) | Crisp, modern SVG icons |
| **Database** | Supabase PostgreSQL | ตารางเครดิต รีวิว และตั้งค่าร้าน พร้อม RLS, index และ JSONB |
| **Storage** | Supabase Storage | เก็บรูปหลักฐานผ่าน server API |
| **Testing** | Vitest + Supertest | ทดสอบ validation, API, session และ production configuration |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20.19 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### 1. Clone Repository
```bash
git clone https://github.com/underwaves/credits.git
cd credits
```

### 2. Configure Environment
Copy `.env.example` to `.env`, then set at least a strong `ADMIN_PIN`. For Supabase, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never commit `.env`.

In a Supabase project, run `supabase_schema.sql` and then `supabase_security_migration.sql` once in the SQL Editor.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Application
```bash
npm start
```
The server will start at:
- **Public Customer Site:** `http://localhost:3000`
- **Admin Studio:** `http://localhost:3000/admin`

For development with frontend live reloading, run these in separate terminals:
```bash
npm run dev:server
npm run dev
```

### 5. Verify Before Deployment
```bash
npm test
npm run build
npm run qa
```

---

## 🔑 Admin Guide

1. Navigate to `http://localhost:3000/admin` in your browser.
2. Enter the admin PIN configured in your `.env` (`ADMIN_PIN`) or production environment variables.
3. Inside the Admin Studio, you can:
   - **Upload Credits:** Drop proof screenshots into the dropzone, fill in details, and click submit.
   - **Pin Items:** Click the star icon to pin important transactions to the top.
   - **Edit / Delete:** Modify pricing, title, notes, or delete records.
   - **Update PIN & Settings:** Change your PIN and store announcement at the Settings tab.
   - **Download Backup:** Export data as a `.json` file for safekeeping. PIN and PIN hash are deliberately excluded.

---

## 🌐 Deployment

### Option 1: Instant Public URL (Cloudflare Tunnel)
To test and share with friends/customers on mobile devices right now:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

### Option 2: 24/7 Free Cloud Hosting (Render.com)
1. Fork or push this repository to your GitHub account.
2. Create an account at [Render.com](https://render.com).
3. Click **New +** -> **Web Service** -> Connect this repository.
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
5. Click **Create Web Service** — your app is live 24/7 with automatic HTTPS!

*(Detailed step-by-step instructions available in [DEPLOY.md](DEPLOY.md))*

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Crafted with ❤️ by <strong><a href="https://github.com/underwaves">SUNFZ (underwaves)</a></strong>
</div>
