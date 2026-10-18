import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'SUNFZENITH_System_Architecture_Guide.pdf');

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>SUNFZENITH — รายงานสรุปสถาปัตยกรรมระบบอย่างละเอียด</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Prompt:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10.5pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Prompt', sans-serif;
      color: #0f172a;
      font-weight: 700;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      line-height: 1.25;
      color: #0f172a;
      border-bottom: 2.5px solid #f59e0b;
      padding-bottom: 8px;
      margin-top: 0;
    }

    h2 {
      font-size: 14pt;
      line-height: 1.3;
      color: #1e293b;
      border-left: 4px solid #f59e0b;
      padding-left: 8px;
      margin-top: 1.4em;
    }

    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 1.1em;
    }

    h4 {
      font-size: 11pt;
      color: #475569;
    }

    p {
      margin-top: 0.3em;
      margin-bottom: 0.6em;
      text-align: justify;
    }

    /* Cover Page */
    .cover-page {
      padding: 30px 20px 20px 20px;
      margin-bottom: 30px;
      border-bottom: 1.5px solid #e2e8f0;
      page-break-after: always;
      break-after: always;
      text-align: center;
    }

    .cover-logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 18px;
      border-radius: 9999px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #b45309;
      font-weight: 700;
      font-size: 11pt;
      margin-bottom: 16px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      margin: 10px 0 6px 0;
      letter-spacing: -0.5px;
    }

    .cover-subtitle {
      font-size: 14pt;
      color: #d97706;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .cover-desc {
      font-size: 11pt;
      color: #475569;
      max-width: 600px;
      margin: 0 auto 24px auto;
      line-height: 1.6;
    }

    .meta-card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-width: 580px;
      margin: 0 auto;
      text-align: left;
    }

    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }

    .meta-label {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .meta-val {
      font-size: 10pt;
      color: #0f172a;
      font-weight: 600;
      margin-top: 2px;
    }

    /* Content Cards & Boxes */
    .callout-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 10pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .callout-box.info {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-left: 4px solid #0284c7;
    }

    .callout-box.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
    }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .table-custom th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      font-family: 'Prompt', sans-serif;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }

    .table-custom td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .table-custom tr:nth-child(even) td {
      background: #f8fafc;
    }

    .code-badge {
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 9pt;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1.5px 5px;
      border-radius: 4px;
      color: #0f172a;
    }

    pre {
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 8.8pt;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 8px;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.45;
      margin: 10px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .feature-card h4 {
      margin-top: 0;
      margin-bottom: 6px;
      font-size: 10.5pt;
      color: #0f172a;
    }

    ul, ol {
      margin-top: 4px;
      margin-bottom: 8px;
      padding-left: 22px;
    }

    li {
      margin-bottom: 3px;
    }

    .section-break {
      page-break-before: always;
      break-before: always;
    }

    .badge-pill {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #e2e8f0;
      color: #334155;
    }
    .badge-pill.amber { background: #fef3c7; color: #b45309; }
    .badge-pill.emerald { background: #dcfce7; color: #15803d; }
    .badge-pill.sky { background: #e0f2fe; color: #0369a1; }
    .badge-pill.rose { background: #ffe4e6; color: #be123c; }
  </style>
</head>
<body>

  <!-- ================= COVER PAGE ================= -->
  <div class="cover-page">
    <div class="cover-logo-badge">
      <span>☀️</span> SUNFZENITH TECHNICAL SPECIFICATION
    </div>
    <div class="cover-title">SUNFZENITH (ซันเอฟซีนิท)</div>
    <div class="cover-subtitle">Small Dream, Big Zenith — คู่มือสถาปัตยกรรมระบบและโครงสร้างโค้ดฉบับสมบูรณ์</div>
    
    <div class="cover-desc">
      เอกสารฉบับนี้จัดทำขึ้นเพื่ออธิบายหลักการทำงานของเว็บไซต์ SUNFZENITH อย่างละเอียด เจาะลึกโครงสร้างโค้ดทุกโฟลเดอร์ ทุกไฟล์ ระบบรักษาความปลอดภัย การเชื่อมต่อฐานข้อมูล ตลอดจนการทำงานทั้งส่วนหน้าบ้าน (Frontend) และส่วนหลังบ้าน (Backend & Admin Studio)
    </div>

    <div class="meta-card-grid">
      <div class="meta-card">
        <div class="meta-label">เวอร์ชันระบบ</div>
        <div class="meta-val">2.0.0 (Production Ready)</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">สถาปัตยกรรมหลัก</div>
        <div class="meta-val">Full-Stack Hybrid Resilience</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">เซิร์ฟเวอร์ & ฐานข้อมูล</div>
        <div class="meta-val">Node.js, Express v5, Supabase (PostgreSQL)</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">เครื่องมือหน้าบ้าน</div>
        <div class="meta-val">Vite 8, Tailwind CSS, Modular Vanilla JS</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">สถานะการทดสอบ</div>
        <div class="meta-val" style="color: #16a34a;">ผ่าน 61 / 61 Tests (100% Passed)</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">ผู้พัฒนาและเจ้าของลิขสิทธิ์</div>
        <div class="meta-val">SUNFZENITH Digital Studio</div>
      </div>
    </div>
  </div>

  <!-- ================= SECTION 1 ================= -->
  <h2>1. ภาพรวมของระบบและจุดประสงค์หลัก (System Overview)</h2>
  <p>
    เว็บไซต์ <strong>SUNFZENITH</strong> เป็นเว็บแอปพลิเคชันรูปแบบ Full-Stack ที่รวบรวมฟังก์ชันการทำงาน 3 มิติหลักไว้ในแพลตฟอร์มเดียวกันอย่างกลมกลืน:
  </p>
  <ul>
    <li>
      <strong>1. Brand Website & Portfolio (หน้าร้านและพอร์ตโฟลิโอ - <code>/</code>):</strong>
      ทำหน้าที่เป็น Landing Page นำเสนอบริการดิจิทัล (รับทำเว็บไซต์, Web App, ออกแบบสไลด์, โปสเตอร์/อินโฟกราฟิก), แสดงตัวอย่างผลงานที่คัดกรองตามหมวดหมู่ได้, มีหน้าต่าง Lightbox ขยายดูภาพชัดเจน, และมี Rate Card Modal สำหรับดูตารางเรทราคาทุกระดับอย่างโปร่งใส
    </li>
    <li>
      <strong>2. Credits & Reviews Platform (สมุดรวมเครดิตและรีวิวลูกค้า - <code>/credits</code>):</strong>
      ทำหน้าที่สร้างความน่าเชื่อถือระดับสูงสุด โดยบันทึกประวัติการส่งมอบงานจริง 100% เชื่อมต่อระบบรีวิวแบบเปิดที่ลูกค้าสามารถกด <strong>+1 (ให้เครดิต)</strong> หรือ <strong>-1 (รายงานปัญหา)</strong> พร้อม <em>"ระบบบังคับแนบรูปภาพหลักฐานสลิป/แชท"</em> เพื่อป้องกันสแปม มีระบบค้นหา Real-Time Debounce และระบบ Deep-Link เปิดดูเครดิตใบเฉพาะผ่าน URL ได้ทันที
    </li>
    <li>
      <strong>3. Admin Studio (ห้องควบคุมหลังบ้าน - <code>/admin</code>):</strong>
      ศูนย์กลางบริหารจัดการเนื้อหา (Full CMS) ของเจ้าของร้าน เข้าสู่ระบบด้วยรหัส PIN ปลอดภัยสูง จัดการได้ทั้งเนื้อหาหน้าแรก, หัวข้อบริการ, แพ็กเกจราคา, รายการผลงาน, เครดิตร้าน, ลบรีวิวที่ไม่เหมาะสม, เปลี่ยน PIN, ตลอดจนการ <strong>Export / Import Backup JSON</strong> เพื่อสำรองและกู้คืนข้อมูลทั้งระบบ
    </li>
  </ul>

  <div class="callout-box success">
    <strong>💡 จุดเด่นเรื่องความทนทาน (Hybrid Data Resilience):</strong><br/>
    ระบบถูกออกแบบมาให้ไม่มีวันล่ม หากเซิร์ฟเวอร์สามารถเชื่อมต่อกับ Supabase Cloud ได้ ข้อมูลจะถูกจัดเก็บบน PostgreSQL และ Cloud Storage แต่หากไม่มีเน็ตหรือเชื่อมต่อไม่ได้ เซิร์ฟเวอร์จะสลับไปอ่าน-เขียนไฟล์ JSON และโฟลเดอร์ไฟล์ในเครื่องแบบอัตโนมัติ 100%
  </div>

  <!-- ================= SECTION 2 ================= -->
  <h2>2. เทคโนโลยีและเครื่องมือที่ใช้ (Tech Stack & Tooling)</h2>

  <table class="table-custom">
    <thead>
      <tr>
        <th style="width: 25%;">ส่วนงาน (Layer)</th>
        <th style="width: 35%;">เทคโนโลยี / ไลบรารี</th>
        <th style="width: 40%;">บทบาทหน้าที่และความสำคัญ</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Backend Runtime</strong></td>
        <td><span class="code-badge">Node.js (v20+)</span> (ES Modules)</td>
        <td>รันระบบเซิร์ฟเวอร์ด้วยมาตรฐาน JavaScript สมัยใหม่ รองรับ <code>import / export</code></td>
      </tr>
      <tr>
        <td><strong>Web Framework</strong></td>
        <td><span class="code-badge">Express v5 (^5.2.1)</span></td>
        <td>จัดการ HTTP Request, Routing, Middlewares และระบบ Error Handling ที่แม่นยำ</td>
      </tr>
      <tr>
        <td><strong>Database & Storage</strong></td>
        <td><span class="code-badge">Supabase (@supabase/supabase-js)</span></td>
        <td>ฐานข้อมูล PostgreSQL บนคลาวด์ พร้อม Storage Bucket <code>credit-images</code> เก็บรูปภาพ</td>
      </tr>
      <tr>
        <td><strong>File Upload Engine</strong></td>
        <td><span class="code-badge">Multer (^2.4.0)</span> (Memory Storage)</td>
        <td>รับไฟล์รูปภาพเข้า Buffer ในหน่วยความจำเพื่อตรวจสอบไบต์ก่อนบันทึกจริง ป้องกันไฟล์แฝง</td>
      </tr>
      <tr>
        <td><strong>Cryptography & Auth</strong></td>
        <td><span class="code-badge">node:crypto (Built-in)</span></td>
        <td>เข้ารหัส Scrypt พร้อม Salt สำหรับ PIN, สร้างโทเคนเซสชัน HMAC-SHA256, และ Timing-Safe check</td>
      </tr>
      <tr>
        <td><strong>Frontend Bundler</strong></td>
        <td><span class="code-badge">Vite (^8.3.3)</span></td>
        <td>คอมไพล์และแพ็กรวมหน้าเว็บ (Bundling), ย่อขนาดโค้ด, และจำลอง Dev Server Proxy</td>
      </tr>
      <tr>
        <td><strong>Styling & Design</strong></td>
        <td><span class="code-badge">Tailwind CSS + CSS Design Tokens</span></td>
        <td>จัดสไตล์หน้าเครดิตและแอดมินด้วย Tailwind ร่วมกับ Custom Design Tokens หน้าแรกเพื่อสลับธีมมืด/สว่าง</td>
      </tr>
      <tr>
        <td><strong>Automated Testing</strong></td>
        <td><span class="code-badge">Vitest (^5.0.3) + Supertest (^7.3.1)</span></td>
        <td>รันชุดทดสอบ Integration & Unit Tests ตรวจจับบั๊กและข้อผิดพลาดอัตโนมัติ 61 รายการ</td>
      </tr>
    </tbody>
  </table>

  <!-- ================= SECTION 3 ================= -->
  <div class="section-break"></div>
  <h2>3. โครงสร้างโฟลเดอร์และไฟล์ทุกส่วนอย่างละเอียด (File & Directory Breakdown)</h2>

  <p>ด้านล่างนี้คือแผนผังไฟล์ทั้งหมดในระบบ พร้อมคำอธิบายหน้าที่แบบ 1-ต่อ-1:</p>

  <table class="table-custom">
    <thead>
      <tr>
        <th style="width: 30%;">โฟลเดอร์ / ชื่อไฟล์</th>
        <th style="width: 70%;">หน้าที่และคำอธิบายการทำงาน</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="code-badge">server.js</span></td>
        <td><strong>Entry Point ของเซิร์ฟเวอร์:</strong> ดึงการตั้งค่าจาก <code>config.js</code> เรียก <code>createApp()</code> ทำการ Health Check เชื่อมต่อ Supabase แล้วสั่งเปิดพอร์ตรับคำขอ (Default Port 3000)</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/app.js</span></td>
        <td><strong>ศูนย์รวมการตั้งค่า Express:</strong> รวบรวม Middlewares ด้านความปลอดภัย (CSP, CORS, Compression, Rate Limit), จัดการเส้นทาง Static Files (เสิร์ฟจาก <code>dist/</code> ในโหมด Production), เส้นทาง API, และดักจับหน้า 404 / 500</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/config.js</span></td>
        <td><strong>ศูนย์รวมการอ่านค่า Environment:</strong> ตรวจสอบตัวแปรระบบอย่างเข้มงวด หากรันใน Production จะบังคับว่าต้องมี <code>SESSION_SECRET</code> ยาวไม่ต่ำกว่า 32 ตัวอักษร และต้องใช้ <code>SUPABASE_SERVICE_ROLE_KEY</code> เท่านั้น</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/routes/public.js</span></td>
        <td><strong>API ฝั่งสาธารณะ:</strong> ให้บริการ <code>GET /content</code>, <code>GET /settings</code>, <code>GET /credits</code>, <code>GET /portfolio</code>, <code>GET /reviews</code> และ <code>POST /reviews</code> (ส่งรีวิวพร้อมอัปโหลดรูปภาพ)</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/routes/admin.js</span></td>
        <td><strong>API ฝั่งแอดมิน:</strong> ล็อกอิน <code>/login</code>, ตรวจสอบเซสชัน <code>/check</code>, CRUD บริการ, แพ็กเกจราคา, ผลงาน, เครดิตร้าน, ลบรีวิว, เปลี่ยน PIN, ตลอดจนระบบ <code>/export</code> และ <code>/import</code> Backup JSON</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/routes/seo.js</span></td>
        <td><strong>จัดการ Search Engine:</strong> สร้างไฟล์ <code>/robots.txt</code> และ <code>/sitemap.xml</code> อัตโนมัติ เพื่อให้ Google ค้นหาหน้าเว็บเจอและจัดอันดับได้ดีขึ้น</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/services/db.js</span></td>
        <td><strong>หัวใจหลักในการติดต่อฐานข้อมูล:</strong> ควบคุมการอ่านเขียนข้อมูลเครดิต, รีวิว, การตั้งค่าร้าน, การอัปโหลดรูปภาพไปยัง Supabase Storage พร้อมฟังก์ชัน Fallback ไปยัง Local JSON อัตโนมัติ</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/services/contentDb.js</span></td>
        <td><strong>ระบบจัดการ CMS:</strong> ควบคุมข้อมูลข้อความหน้าแรก, รายการบริการ (Services CRUD) และแพ็กเกจราคา (Pricing CRUD) เก็บใน <code>content.json</code></td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/services/portfolioDb.js</span></td>
        <td><strong>ระบบจัดการผลงาน:</strong> ควบคุมรายการผลงาน Showcase, ป้ายหมวดหมู่, ลิงก์ดูตัวอย่าง, แท็กเทคโนโลยี เก็บใน <code>portfolio.json</code></td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/middleware/security.js</span></td>
        <td><strong>ระบบรักษาความปลอดภัย:</strong> บรรจุฟังก์ชัน <code>hashPin()</code> (Scrypt), <code>verifyPin()</code>, สร้างและตรวจสอบ Session Cookie (HMAC-SHA256), ตรวจสอบ <code>sameOriginGuard()</code> ป้องกัน CSRF และกำหนด Security Headers</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/middleware/rateLimit.js</span></td>
        <td><strong>ระบบป้องกันสแปม:</strong> ใช้อัลกอริทึม Sliding Window ใน Memory คอยตรวจจับ IP จำกัดการพยายามล็อกอินไม่เกิน 5 ครั้ง/15 นาที และส่งรีวิวไม่เกิน 5 ครั้ง/10 นาที</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/server/middleware/upload.js</span></td>
        <td><strong>ระบบอัปโหลดไฟล์:</strong> ตั้งค่า Multer Memory Storage จำกัดขนาด 5MB ต่อรูป สูงสุด 5 รูป พร้อมฟังก์ชัน <code>detectImageMime()</code> สแกน Magic Bytes ตรวจจับว่าเป็นไฟล์ภาพ JPG/PNG/WebP แท้จริง</td>
      </tr>
      <tr>
        <td><span class="code-badge">src/shared/validation.js</span></td>
        <td><strong>โมดูลตรวจสอบข้อมูลร่วม (Isomorphic):</strong> ฟังก์ชันกรองข้อความ (Sanitize URL, Escape HTML) และตรวจสอบความถูกต้องของฟอร์มที่ใช้ร่วมกันได้ทั้งบนเบราว์เซอร์และบนเซิร์ฟเวอร์</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/index.html</span></td>
        <td><strong>โครงสร้างหน้าแรก:</strong> หน้าร้านโชว์ผลงาน, แนะนำบริการ, ตารางราคา, ขั้นตอนการทำงาน, Rate Card Modal, และกล่องติดต่อ LINE OA</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/credits.html</span></td>
        <td><strong>โครงสร้างหน้าเครดิต:</strong> หน้ารวมฟีดเครดิตการขาย, ปุ่มสลับแท็บทั้งหมด/+1/-1, ช่องค้นหา, ฟอร์มส่งรีวิวลูกค้า, และ Lightbox ขยายดูภาพสลิป</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/public/admin.html</span></td>
        <td><strong>โครงสร้างหน้าแอดมิน:</strong> หน้าต่างกรอก PIN สำหรับเข้าสู่ระบบ และแผงแดชบอร์ด 9 แท็บสำหรับบริหารจัดการทั้งระบบ</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/src/entries/home.js</span></td>
        <td><strong>สคริปต์ควบคุมหน้าแรก:</strong> สลับธีมมืด/สว่าง, เลื่อนเปิดเมนูมือถือ, กรองผลงานตามแท็บ, ดึงข้อมูล CMS จากเซิร์ฟเวอร์, เปิดปิด Rate Card Modal และ Portfolio Lightbox</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/public/js/app.js</span></td>
        <td><strong>สคริปต์ควบคุมหน้าเครดิต:</strong> ดึงรายการเครดิตและรีวิว, รองรับการค้นหา, ส่งรีวิวพร้อมรูปภาพ, เปิดดูรูปขยายใหญ่, ซูมภาพ, และคัดลอกลิงก์ Deep-link</td>
      </tr>
      <tr>
        <td><span class="code-badge">web/public/js/admin.js</span></td>
        <td><strong>สคริปต์ควบคุมหน้าแอดมิน:</strong> ควบคุมตรรกะการล็อกอิน, การสลับแท็บควบคุม, การบันทึกข้อมูลฟอร์ม, อัปโหลดภาพ, ตลอดจนการดาวน์โหลดและอัปโหลดไฟล์สำรองข้อมูล JSON</td>
      </tr>
      <tr>
        <td><span class="code-badge">scripts/postinstall.js</span></td>
        <td><strong>สคริปต์อัตโนมัติหลังติดตั้ง:</strong> สั่งรัน <code>vite build</code> สร้างโฟลเดอร์ <code>dist/</code> อัตโนมัติทันทีที่ Deploy ขึ้นแพลตฟอร์ม Cloud เช่น Render</td>
      </tr>
    </tbody>
  </table>

  <!-- ================= SECTION 4 ================= -->
  <div class="section-break"></div>
  <h2>4. เจาะลึกการทำงานของหน้าเว็บหลักทั้ง 3 หน้า (Deep Dive Pages)</h2>

  <div class="grid-2col">
    <div class="feature-card">
      <h4>🌐 1. Brand Studio & Showcase (หน้าแรก <code>/</code>)</h4>
      <ul>
        <li><strong>Zero-Flicker Theme:</strong> มีสคริปต์ดักจับใน <code>&lt;head&gt;</code> อ่านธีมจาก localStorage ก่อนเบราว์เซอร์วาดหน้าจอ หมดปัญหาหน้าจอขาววาบเมื่อเปิด Dark Mode</li>
        <li><strong>Dynamic CMS Sync:</strong> ข้อความหัวเว็บ, สโลแกนมาสคอต, แถบประกาศ (Announcement), และลิงก์โซเชียลจะดึงจาก Backend แบบ Real-time แก้ไขในแอดมินแล้วหน้าเว็บเปลี่ยนทันที</li>
        <li><strong>Portfolio Filter & Lightbox:</strong> แสดงผลงานจัดหมวดหมู่ คลิกดูภาพขยายใหญ่พร้อมคำอธิบายและแท็กเทคโนโลยี</li>
        <li><strong>Rate Card Modal:</strong> ป๊อปอัปตารางราคาละเอียดแบ่ง 5 แท็บ: ทำเว็บ, สไลด์, โปสเตอร์, เช็กลิสต์, และเงื่อนไขการทำงาน</li>
        <li><strong>LINE OA CTA:</strong> ปุ่มติดต่อมุ่งตรงไปยัง LINE OA <code>@419ajynp</code></li>
      </ul>
    </div>

    <div class="feature-card">
      <h4>👍 2. Credits & Reviews Platform (หน้า <code>/credits</code>)</h4>
      <ul>
        <li><strong>3-Mode Feed Tabs:</strong> สลับดูได้ระหว่าง "เครดิตทั้งหมดจากร้าน", "👍 +1 รีวิวจากลูกค้า", และ "⚠️ -1 รายงานปัญหา"</li>
        <li><strong>Real-Time Search:</strong> ช่องค้นหาพร้อมระบบ Debounce 300ms ค้นหาทั้งชื่อสินค้า, ลูกค้า, และข้อความรีวิว</li>
        <li><strong>Mandatory Proof Review:</strong> ลูกค้าสามารถส่งรีวิวได้ แต่บังคับต้องแนบรูปหลักฐานสลิป/แชท (สูงสุด 5 รูป) เพื่อป้องกันสแปม</li>
        <li><strong>Deep-Link URL:</strong> คลิกดูเครดิตใบใด URL จะเปลี่ยนเป็น <code>?credit=&lt;id&gt;</code> สามารถก็อปลิงก์ไปแชร์ให้ผู้อื่นเปิดดูภาพขยายของเครดิตใบนั้นได้ทันที</li>
        <li><strong>Zoom & Slider:</strong> ซูมภาพได้ 1.6x และสลับดูรูปภาพย่อยได้อย่างลื่นไหล</li>
      </ul>
    </div>
  </div>

  <div class="feature-card" style="margin-top: 10px;">
    <h4>🔑 3. Admin Studio (ห้องควบคุมหลังบ้าน <code>/admin</code>)</h4>
    <p>
      ระบบจัดการหลังบ้านที่เข้าถึงได้ด้วยรหัส PIN โดยระบบจะออก Session Cookie แบบ <strong>HttpOnly; SameSite=Lax</strong> (อายุ 7 วัน) ภายในแบ่งออกเป็น 9 แท็บครอบคลุมทุกมิติ:
    </p>
    <div class="grid-2col" style="margin-top: 6px;">
      <div>
        <ul>
          <li><strong>🏠 หน้าแรก:</strong> แก้ข้อความ Hero, คำประกาศ, สถานะเปิดร้าน</li>
          <li><strong>🌐 บริการ:</strong> เพิ่ม/แก้ไข/ลบหัวข้อบริการและราคาเริ่มต้น</li>
          <li><strong>🏷️ แพ็กเกจราคา:</strong> ปรับแต่งการ์ดราคาและรายการฟีเจอร์เด่น</li>
          <li><strong>🎨 ผลงาน:</strong> เพิ่มผลงานใหม่ อัปโหลดรูป ระบุหมวดหมู่และลิงก์</li>
          <li><strong>💬 โซเชียล:</strong> อัปเดตลิงก์ LINE OA, Facebook, Discord, TikTok</li>
        </ul>
      </div>
      <div>
        <ul>
          <li><strong>➕ เพิ่มเครดิต:</strong> บันทึกประวัติการขาย แนบรูปภาพสลิป ระบุราคา</li>
          <li><strong>📋 จัดการเครดิต:</strong> แก้ไข ลบ หรือกด "ปักหมุด" นำรายการขึ้นบนสุด</li>
          <li><strong>⭐ จัดการรีวิว:</strong> ตรวจสอบและลบรีวิวที่เข้าข่ายสแปมหรือผิดระเบียบ</li>
          <li><strong>⚙️ ตั้งค่า & สำรอง:</strong> เปลี่ยนรหัส PIN และกด <strong>Export / Import Backup JSON</strong> เพื่อสำรองหรือกู้คืนข้อมูลได้ในคลิกเดียว</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- ================= SECTION 5 ================= -->
  <div class="section-break"></div>
  <h2>5. ระบบความปลอดภัยและการตรวจสอบข้อมูล (Security Architecture)</h2>

  <p>ระบบ SUNFZENITH ถูกสร้างขึ้นด้วยมาตรฐานความปลอดภัยระดับ Production ครอบคลุม 6 ชั้น:</p>

  <table class="table-custom">
    <thead>
      <tr>
        <th style="width: 25%;">ด่านความปลอดภัย</th>
        <th style="width: 35%;">เทคโนโลยีที่ใช้</th>
        <th style="width: 40%;">ผลลัพธ์ในการป้องกัน</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. รหัสผ่านแอดมิน</strong></td>
        <td><span class="code-badge">Scrypt Hashing + Random Salt</span></td>
        <td>รหัส PIN จะถูกเติม Salt สุ่ม 16 ไบต์ และเข้ารหัสด้วย Scrypt ทนทานต่อการโจมตีแบบ Brute-Force และ GPU Cracking</td>
      </tr>
      <tr>
        <td><strong>2. เซสชันแอดมิน</strong></td>
        <td><span class="code-badge">HMAC-SHA256 Signed Cookie</span></td>
        <td>โทเคนถูกส่งผ่านคุกกี้ <code>HttpOnly; SameSite=Lax; Secure</code> ป้องกันการถูกขโมยผ่านสคริปต์หน้าบ้าน (XSS Protection)</td>
      </tr>
      <tr>
        <td><strong>3. ป้องกันการสุ่มเวลา</strong></td>
        <td><span class="code-badge">crypto.timingSafeEqual</span></td>
        <td>เปรียบเทียบสตริงรหัสผ่านและโทเคนด้วยเวลาคงที่ ป้องกันการเจาะระบบด้วยวิธี Timing Attack</td>
      </tr>
      <tr>
        <td><strong>4. ป้องกันข้ามไซต์ (CSRF)</strong></td>
        <td><span class="code-badge">sameOriginGuard Middleware</span></td>
        <td>ตรวจสอบ Origin Header ในคำขอ POST/PUT/DELETE ให้ตรงกับโดเมนของเซิร์ฟเวอร์เท่านั้น บล็อกคำขอข้ามโดเมนทันที</td>
      </tr>
      <tr>
        <td><strong>5. สแกนไฟล์อัปโหลด</strong></td>
        <td><span class="code-badge">Magic Bytes Inspection</span></td>
        <td>ตรวจไบต์แท้จริงของไฟล์รูปภาพใน Buffer (FF D8 FF สำหรับ JPG, 89 50 4E 47 สำหรับ PNG) ปฏิเสธไฟล์ SVG/HTML/Script ป้องกันการฝังโค้ดอันตราย</td>
      </tr>
      <tr>
        <td><strong>6. ป้องกันการยิงสแปม</strong></td>
        <td><span class="code-badge">Sliding Window Rate Limiter</span></td>
        <td>จำกัดความถี่คำขอต่อ IP: ล็อกอินได้ไม่เกิน 5 ครั้ง/15 นาที, ส่งรีวิวไม่เกิน 5 ครั้ง/10 นาที, คำขอทั่วไปไม่เกิน 120 ครั้ง/นาที</td>
      </tr>
    </tbody>
  </table>

  <!-- ================= SECTION 6 ================= -->
  <h2>6. ลำดับขั้นตอนการทำงานของข้อมูล (End-to-End Data Flows)</h2>

  <h3>Flow ตัวอย่าง: การส่งรีวิว +1 หรือ -1 ของลูกค้า</h3>
  <ol>
    <li>ลูกค้ากดปุ่ม "ให้คะแนนร้าน +1" หรือ "รายงานปัญหา -1" ในหน้า <code>/credits</code></li>
    <li>ฟอร์มแสดงขึ้นมา ลูกค้ากรอกชื่อ, ข้อความรีวิว, และ <strong>เลือกรูปภาพหลักฐาน</strong> (สลิปหรือภาพแชท)</li>
    <li>JavaScript ฝั่งเบราว์เซอร์ตรวจสอบชนิดไฟล์เบื้องต้นและขนาดไม่เกิน 5MB ต่อไฟล์</li>
    <li>คำขอถูกส่งแบบ <code>multipart/form-data</code> ไปที่ <code>POST /api/public/reviews</code></li>
    <li>เซิร์ฟเวอร์ตรวจสอบความถี่คำขอ (Rate Limiting) และนำไฟล์เข้า Memory Buffer ผ่าน Multer</li>
    <li>ฟังก์ชัน <code>detectImageMime()</code> สแกน Magic Bytes ตรวจสอบว่าเป็นไฟล์ภาพแท้จริง</li>
    <li>เซิร์ฟเวอร์อัปโหลดรูปภาพไปยัง Supabase Storage Bucket <code>credit-images</code></li>
    <li>เซิร์ฟเวอร์บันทึกข้อมูลรีวิวลงตาราง <code>customer_reviews</code> ใน Supabase PostgreSQL</li>
    <li><em>(กรณีผิดพลาด):</em> หากฐานข้อมูลบันทึกไม่สำเร็จ ระบบจะทำการ <strong>Rollback ลบรูปภาพที่เพิ่งอัปโหลดทิ้งทันที</strong> ไม่ทิ้งขยะตกค้าง</li>
    <li>เซิร์ฟเวอร์ตอบกลับ <code>{ success: true }</code> -> หน้าเว็บอัปเดตตัวเลขสถิติและแสดงรีวิวใหม่ทันที</li>
  </ol>

  <!-- ================= SECTION 7 ================= -->
  <div class="section-break"></div>
  <h2>7. คู่มือคำสั่งและการนำขึ้นใช้งาน (Commands & Runbook)</h2>

  <p>คำสั่งสำหรับนักพัฒนาในการทดสอบ รัน และจัดการระบบ:</p>

  <table class="table-custom">
    <thead>
      <tr>
        <th style="width: 30%;">คำสั่ง (Command)</th>
        <th style="width: 70%;">การทำงานและผลลัพธ์</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="code-badge">npm run dev</span></td>
        <td>รันเซิร์ฟเวอร์ฝั่ง Frontend ด้วย Vite สำหรับการเขียนและดูผลแบบ Hot Module Replacement (HMR)</td>
      </tr>
      <tr>
        <td><span class="code-badge">npm run dev:server</span></td>
        <td>รัน Backend Express เซิร์ฟเวอร์ด้วยโหมด Node Watch (รีสตาร์ตอัตโนมัติเมื่อแก้โค้ดเซิร์ฟเวอร์)</td>
      </tr>
      <tr>
        <td><span class="code-badge">npm run build</span></td>
        <td>คอมไพล์และสร้าง Production Bundle เก็บไว้ที่โฟลเดอร์ <code>dist/</code> พร้อมใช้งานจริง</td>
      </tr>
      <tr>
        <td><span class="code-badge">npm start</span></td>
        <td>รันเซิร์ฟเวอร์ Production จริง (เสิร์ฟทั้ง API และหน้าเว็บจากโฟลเดอร์ <code>dist/</code>)</td>
      </tr>
      <tr>
        <td><span class="code-badge">npm test</span></td>
        <td>รันชุดทดสอบอัตโนมัติทั้งหมด 61 การทดสอบด้วย Vitest เพื่อตรวจเช็กความสมบูรณ์ของระบบ</td>
      </tr>
      <tr>
        <td><span class="code-badge">npm run qa</span></td>
        <td>รันสคริปต์ตรวจความสมบูรณ์ของ Production Build (ตรวจไฟล์ HTML, CSS, WOFF2 ฟอนต์ และการตั้งค่า)</td>
      </tr>
    </tbody>
  </table>

  <h3>ตัวแปรสภาพแวดล้อมที่สำคัญ (Environment Variables)</h3>
  <ul>
    <li><code>PORT</code>: พอร์ตที่ต้องการเปิดบริการ (ค่าเริ่มต้นคือ <code>3000</code>)</li>
    <li><code>NODE_ENV</code>: ตั้งค่าเป็น <code>production</code> เพื่อเปิดโหมดความปลอดภัยสูงสุด</li>
    <li><code>SESSION_SECRET</code>: รหัสลับสุ่มอย่างน้อย 32 ตัวอักษรสำหรับเซ็นรับรองคุกกี้เซสชันของแอดมิน</li>
    <li><code>ADMIN_PIN</code>: รหัสผ่าน PIN สำหรับแอดมิน (ความยาว 6-64 ตัวอักษร ห้ามใช้รหัสคาดเดาง่าย เช่น 1234 หรือ 3645)</li>
    <li><code>SUPABASE_URL</code>: URL โปรเจกต์ Supabase ของคุณ (เช่น <code>https://xxxx.supabase.co</code>)</li>
    <li><code>SUPABASE_SERVICE_ROLE_KEY</code>: กุญแจ Service Role Key สำหรับสิทธิ์จัดการฐานข้อมูลและ Storage ฝั่งเซิร์ฟเวอร์</li>
    <li><code>SITE_URL</code>: โดเมนหลักของเว็บไซต์ (เช่น <code>https://sunfz-credits.onrender.com</code>)</li>
  </ul>

  <div class="callout-box info" style="margin-top: 20px;">
    <strong>✨ สรุปภาพรวม:</strong><br/>
    ระบบของ SUNFZENITH ได้รับการออกแบบโครงสร้างตามหลัก Clean Architecture, มีความปลอดภัยระดับสูง (Zero Trust), มีความยืดหยุ่นด้วยระบบคู่ขนาน (Supabase + Local Fallback), และมีประสิทธิภาพการโหลดหน้าเว็บที่รวดเร็ว พร้อมรองรับการเติบโตของธุรกิจได้อย่างมั่นคง ☀️✨
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 กำลังเริ่มสร้างไฟล์ PDF ด้วย Microsoft Edge (Playwright)...');
  
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📄 กำลังโหลดเนื้อหาและฟอนต์ภาษาไทย (IBM Plex Sans Thai, Prompt)...');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  // Wait a small moment to ensure Google Web Fonts are fully rendered
  await page.waitForTimeout(1500);

  console.log(`🖨️ กำลังพิมพ์เอกสารออกมาเป็นไฟล์ PDF ที่: ${outputPath}`);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8.5pt; font-family: 'IBM Plex Sans Thai', sans-serif; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 14mm;">
        <span>SUNFZENITH — Complete System Architecture Guide (v2.0.0)</span>
        <span>หน้าที่ <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  console.log('✅ สร้างไฟล์ PDF สำเร็จเรียบร้อยแล้ว!');
}

generatePDF().catch((err) => {
  console.error('❌ เกิดข้อผิดพลาดในการสร้าง PDF:', err);
  process.exit(1);
});
