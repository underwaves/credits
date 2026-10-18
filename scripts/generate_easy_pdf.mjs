import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'SUNFZENITH_Easy_Guide.pdf');

const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>SUNFZENITH — คู่มือระบบฉบับเข้าใจง่าย (Easy Guide)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Prompt:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 15mm 14mm 15mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'IBM Plex Sans Thai', sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }

    h1, h2, h3, h4 {
      font-family: 'Prompt', sans-serif;
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }

    h1 {
      font-size: 22pt;
      color: #0f172a;
      border-bottom: 3px solid #f59e0b;
      padding-bottom: 8px;
      margin-top: 0;
    }

    h2 {
      font-size: 14pt;
      color: #0f172a;
      border-left: 5px solid #f59e0b;
      padding-left: 10px;
      margin-top: 1.4em;
    }

    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 1.1em;
    }

    p {
      margin-top: 0.3em;
      margin-bottom: 0.6em;
      text-align: justify;
    }

    .cover-card {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 2px solid #fde68a;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }

    .cover-badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 9999px;
      background: #f59e0b;
      color: #ffffff;
      font-weight: 700;
      font-size: 9.5pt;
      margin-bottom: 10px;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: 800;
      color: #0f172a;
      margin: 6px 0;
    }

    .cover-sub {
      font-size: 13pt;
      color: #b45309;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .analogy-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin: 12px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .analogy-title {
      font-family: 'Prompt', sans-serif;
      font-weight: 700;
      color: #0f172a;
      font-size: 11pt;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .card.highlight {
      border-color: #fcd34d;
      background: #fffdf5;
    }

    .card h4 {
      margin-top: 0;
      margin-bottom: 6px;
      font-size: 11pt;
      color: #0f172a;
    }

    .pill {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 6px;
      background: #e2e8f0;
      color: #334155;
    }
    .pill.sun { background: #fef3c7; color: #b45309; }
    .pill.green { background: #dcfce7; color: #166534; }
    .pill.blue { background: #e0f2fe; color: #075985; }

    .table-clean {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .table-clean th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      font-family: 'Prompt', sans-serif;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }

    .table-clean td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .table-clean tr:nth-child(even) td {
      background: #f8fafc;
    }

    .section-break {
      page-break-before: always;
      break-before: always;
    }
  </style>
</head>
<body>

  <!-- COVER -->
  <div class="cover-card">
    <div class="cover-badge">☀️ ฉบับสรุปเข้าใจง่าย ภาษาคนทั่วไป</div>
    <div class="cover-title">SUNFZENITH ทำงานยังไง?</div>
    <div class="cover-sub">คู่มือสรุประบบและโค้ดฉบับเข้าใจง่ายที่สุด สำหรับเจ้าของโปรเจกต์</div>
    <p style="max-width: 550px; margin: 0 auto; color: #475569; font-size: 10pt;">
      ไม่ต้องเก่งเทคนิค ไม่ต้องท่องศัพท์ยาก เอกสารนี้จะพาไปดูว่าแต่ละหน้าทำงานยังไง โค้ดตรงไหนทำอะไร และระบบดูแลความปลอดภัยให้ร้านยังไงบ้าง
    </p>
  </div>

  <!-- SECTION 1 -->
  <h2>1. มองภาพรวม: ถ้าเปรียบเว็บนี้เป็น "ร้านค้า / สตูดิโอ"</h2>
  <p>เพื่อให้เข้าใจง่ายที่สุด ให้จินตนาการว่าเว็บไซต์ SUNFZENITH ของเราเหมือน <strong>ร้านสตูดิโอรับออกแบบงานจริง</strong> ที่มี 3 โซนหลัก:</p>

  <div class="grid-2col">
    <div class="card highlight">
      <h4>🛍️ 1. โซนหน้าร้าน (หน้าแรก <code>/</code>)</h4>
      <p>เหมือนกระจกหน้าร้านที่จัดแสดงผลงานสวย ๆ ลูกค้าเดินผ่านเข้ามาจะเห็น:</p>
      <ul>
        <li>ป้ายไฟมาสคอตพระอาทิตย์ยิ้มแย้ม สลับโหมดมืด/สว่างได้</li>
        <li>เมนูบริการ (ทำเว็บ, สไลด์, โปสเตอร์) พร้อมราคาเริ่มต้น</li>
        <li>ตู้โชว์ผลงาน (Portfolio) คลิกดูรูปใหญ่ได้</li>
        <li>สมุดเรทราคาละเอียด (Rate Card) กดเปิดดูตารางราคาได้</li>
        <li>ปุ่มทักแชท LINE OA คุยกับเราโดยตรง</li>
      </ul>
    </div>

    <div class="card highlight">
      <h4>🛡️ 2. โซนบอร์ดการันตี (หน้าเครดิต <code>/credits</code>)</h4>
      <p>เหมือนบอร์ดโชว์ความน่าเชื่อถือและความโปร่งใสของร้าน:</p>
      <ul>
        <li>แสดงประวัติส่งมอบงานจริง 100% มีสลิปให้ตรวจเช็ก</li>
        <li>มีระบบให้คะแนน: <strong>+1 (ชมร้าน)</strong> หรือ <strong>-1 (แจ้งปัญหา)</strong></li>
        <li><strong>มีกติกาสำคัญ:</strong> ใครจะรีวิวต้องแนบรูปสลิป/แชทหลักฐานจริงเท่านั้น เพื่อกันคนแกล้งหรือยิงสแปม</li>
        <li>คลิกรูปดูขยายใหญ่ ซูมดูสลิปได้ และก๊อปลิงก์ไปแชร์ได้</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top: 6px;">
    <h4>🔑 3. โซนห้องทำงานส่วนตัว (ห้องแอดมิน <code>/admin</code>)</h4>
    <p>
      ห้องทำงานหลังร้านสำหรับเจ้าของร้านคนเดียวเท่านั้น ต้องมีรหัส PIN ลับถึงจะไขเข้าห้องได้ ข้างในมีโต๊ะทำงานสำหรับ:
    </p>
    <ul>
      <li>แก้ข้อความหน้าแรก, คำประกาศ, สโลแกนร้าน โดยไม่ต้องไปแก้โค้ด</li>
      <li>เพิ่มผลงานใหม่, เพิ่ม/ลดรายการราคา, เพิ่มเครดิตการขายพร้อมรูปสลิป</li>
      <li>ตรวจสอบและลบรีวิวที่ไม่เหมาะสมทิ้งได้</li>
      <li>มีปุ่ม <strong>Backup JSON</strong> สำหรับกดเซฟข้อมูลทั้งหมดเก็บไว้ในคอม เผื่อคอมพังก็กู้คืนได้ในคลิกเดียว</li>
    </ul>
  </div>

  <!-- SECTION 2 -->
  <div class="section-break"></div>
  <h2>2. ใครทำหน้าที่อะไร? เปรียบเทียบไฟล์โค้ดกับคนทำงานในร้าน</h2>

  <table class="table-clean">
    <thead>
      <tr>
        <th style="width: 25%;">ชื่อไฟล์ในโค้ด</th>
        <th style="width: 25%;">บทบาทในร้าน</th>
        <th style="width: 50%;">หน้าที่แบบภาษาเข้าใจง่าย</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong><code>server.js</code></strong></td>
        <td>สวิตช์ไฟหลักของร้าน</td>
        <td>เริ่มเปิดร้าน เช็กว่าตู้เซฟพร้อมไหม แล้วเปิดประตูรับลูกค้า</td>
      </tr>
      <tr>
        <td><strong><code>src/server/app.js</code></strong></td>
        <td>ผู้จัดการร้าน</td>
        <td>คอยดูภาพรวม กำหนดว่าใครเดินไปห้องไหนได้บ้าง ถ้าคนทั่วไปพาไปหน้าร้าน ถ้ามีรหัสพาเข้าห้องแอดมิน</td>
      </tr>
      <tr>
        <td><strong><code>src/server/config.js</code></strong></td>
        <td>สมุดระเบียบและรหัสลับ</td>
        <td>เก็บความลับของร้าน เช่น รหัส PIN, กุญแจเชื่อมต่อคลาวด์</td>
      </tr>
      <tr>
        <td><strong><code>src/server/middleware/security.js</code></strong></td>
        <td>รปภ. มือหนึ่ง</td>
        <td>คอยตรวจรหัส PIN, ล็อกประตูห้องแอดมิน, ป้องกันไม่ให้แฮกเกอร์แอบเข้ามา</td>
      </tr>
      <tr>
        <td><strong><code>src/server/middleware/upload.js</code></strong></td>
        <td>ฝ่ายตรวจพัสดุ</td>
        <td>คอยเอกซเรย์รูปภาพที่ลูกค้าส่งมา ว่าเป็นรูปภาพแท้ ๆ หรือเป็นไวรัสปลอมตัวมา</td>
      </tr>
      <tr>
        <td><strong><code>src/server/middleware/rateLimit.js</code></strong></td>
        <td>รปภ. คุมคิว</td>
        <td>คอยห้ามคนกดส่งข้อความรัว ๆ หรือเดารหัสผ่านเกิน 5 ครั้ง ให้รอ 15 นาที</td>
      </tr>
      <tr>
        <td><strong><code>src/server/services/db.js</code></strong></td>
        <td>พนักงานคุมตู้เซฟ</td>
        <td>คอยหยิบและเก็บข้อมูลเครดิต, รีวิว, รูปภาพ ไปไว้ที่ Supabase</td>
      </tr>
      <tr>
        <td><strong><code>web/src/entries/home.js</code></strong></td>
        <td>พนักงานตกแต่งหน้าร้าน</td>
        <td>คอยเปิดปิดไฟมืด/สว่าง, เลื่อนเมนูมือถือ, กรองผลงาน, เปิดป๊อปอัปตารางราคา</td>
      </tr>
      <tr>
        <td><strong><code>web/public/js/app.js</code></strong></td>
        <td>พนักงานดูแลบอร์ดเครดิต</td>
        <td>คอยดึงเครดิตมาโชว์, รับรีวิวจากลูกค้า, จัดการค้นหา และขยายรูปสลิป</td>
      </tr>
      <tr>
        <td><strong><code>web/public/js/admin.js</code></strong></td>
        <td>เลขาฯ ส่วนตัวของเจ้าของร้าน</td>
        <td>คอยรับคำสั่งจากเจ้าของร้านในหน้าแอดมิน แล้วส่งไปให้ผู้จัดการเซฟลงตู้เซฟ</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 3 -->
  <h2>3. ข้อมูลถูกเก็บไว้ที่ไหน? (ทำไมเว็บเราถึงไม่เคยล่ม)</h2>
  <div class="analogy-box">
    <div class="analogy-title">💡 ระบบตู้เซฟ 2 ชั้น (Hybrid Resilience)</div>
    <p>ร้านทั่วไปถ้าฐานข้อมูลคลาวด์ดับ เว็บจะพังและเปิดไม่ได้ทันที แต่ร้าน SUNFZENITH มีตู้เซฟ 2 ชุด:</p>
    <ul>
      <li><strong>ชั้นที่ 1: ตู้เซฟบนคลาวด์ (Supabase Cloud)</strong> — เป็นตู้หลัก เก็บข้อมูลลูกค้าและรูปภาพอย่างปลอดภัยบนอินเทอร์เน็ต</li>
      <li><strong>ชั้นที่ 2: สมุดจดในลิ้นชัก (Local JSON Files)</strong> — ถ้าวันไหนเน็ตหลุดหรือ Supabase มีปัญหา ระบบจะหันมาอ่านและเขียนลงไฟล์ JSON ในเครื่อง (<code>credits.json</code>, <code>content.json</code>, <code>portfolio.json</code>) แทนทันที ทำให้เว็บเปิดติดตลอดเวลา 100%!</li>
    </ul>
  </div>

  <!-- SECTION 4 -->
  <div class="section-break"></div>
  <h2>4. ลูกค้าส่งรีวิวเข้ามาแล้วเกิดอะไรขึ้นบ้าง? (การเดินทางของรีวิว)</h2>
  <p>ขั้นตอนตั้งแต่ลูกค้ากดส่งรีวิวจนกระทั่งโชว์บนหน้าเว็บ:</p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
    <ol style="margin: 0; padding-left: 20px;">
      <li><strong>ลูกค้ากดให้ +1 หรือ -1:</strong> ในหน้า <code>/credits</code> พิมพ์ความประทับใจ และ <strong>แนบรูปสลิปหลักฐาน</strong></li>
      <li><strong>เบราว์เซอร์ตรวจเบื้องต้น:</strong> เช็กว่าแนบรูปหรือยัง รูปขนาดใหญ่เกิน 5MB ไหม</li>
      <li><strong>ส่งไปที่เซิร์ฟเวอร์:</strong> รปภ. (Rate Limiter) เช็กว่าไม่ได้กดส่งรัวเกินไปเพื่อแกล้งร้าน</li>
      <li><strong>เอกซเรย์รูปภาพ (Magic Bytes):</strong> ตรวจดูข้างในไฟล์ว่าคือรูปภาพ JPG/PNG/WebP จริง ๆ ไม่ใช่ไฟล์ไวรัสหรือสคริปต์อันตราย</li>
      <li><strong>อัปโหลดรูปขึ้นคลาวด์:</strong> ส่งไฟล์รูปไปเก็บไว้ที่ Supabase Storage (โฟลเดอร์ <code>credit-images</code>)</li>
      <li><strong>บันทึกข้อความลงฐานข้อมูล:</strong> บันทึกชื่อลูกค้า ข้อความ วันที่ และลิงก์รูปภาพ</li>
      <li><strong>มีระบบกู้ภัย (Rollback):</strong> ถ้าเกิดบันทึกข้อความไม่สำเร็จ เซิร์ฟเวอร์จะลบรูปที่เพิ่งอัปโหลดทิ้งทันที จะได้ไม่เปลืองพื้นที่คลาวด์</li>
      <li><strong>หน้าเว็บอัปเดตทันที:</strong> ยอดรีวิว +1 จะเพิ่มขึ้น 1 แต้ม และการ์ดรีวิวจะโชว์ให้ทุกคนเห็นทันที!</li>
    </ol>
  </div>

  <!-- SECTION 5 -->
  <h2>5. สรุปคำสั่งที่เจ้าของร้านต้องรู้</h2>
  <div class="grid-2col">
    <div class="card">
      <h4>คำสั่งตอนพัฒนาในเครื่อง (Local)</h4>
      <ul>
        <li><code>npm run dev:server</code> : เปิดเซิร์ฟเวอร์หลังบ้าน</li>
        <li><code>npm run dev</code> : เปิดหน้าเว็บหน้าบ้าน (แก้โค้ดแล้วหน้าเว็บเปลี่ยนทันที)</li>
        <li><code>npm test</code> : สั่งตรวจเช็กความถูกต้องทั้งระบบอัตโนมัติ (61 ข้อ)</li>
      </ul>
    </div>
    <div class="card">
      <h4>คำสั่งตอนส่งงานขึ้นออนไลน์ (Production)</h4>
      <ul>
        <li><code>npm run build</code> : รวมไฟล์หน้าเว็บให้มีขนาดเล็กและโหลดไวสุด ๆ</li>
        <li><code>npm start</code> : รันระบบจริงบนคลาวด์ (เช่น Render)</li>
        <li><code>npm run qa</code> : เช็กความสมบูรณ์ครั้งสุดท้ายก่อนเปิดให้คนทั้งโลกเข้าชม</li>
      </ul>
    </div>
  </div>

  <div class="analogy-box" style="margin-top: 16px; background: #f0fdf4; border-color: #bbf7d0;">
    <div class="analogy-title" style="color: #166534;">🎉 สรุปความยอดเยี่ยมของระบบ SUNFZENITH</div>
    <p style="margin: 0; color: #166534;">
      เว็บของน้องไม่ได้มีแค่ดีไซน์ที่น่ารักและโหลดไว แต่โครงสร้างภายในถูกออกแบบมาเทียบเท่าระบบของบริษัทชั้นนำ: ทั้งความปลอดภัยสูง ป้องกันสแปมได้จริง มีระบบสำรองข้อมูลไม่กลัวล่ม และมีหลังบ้านที่จัดการง่ายด้วยตัวเองทุกส่วนค่ะ! ☀️✨
    </p>
  </div>

</body>
</html>
`;

async function generateEasyPDF() {
  console.log('🚀 กำลังสร้าง PDF ฉบับเข้าใจง่าย (SUNFZENITH_Easy_Guide.pdf)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8.5pt; font-family: 'IBM Plex Sans Thai', sans-serif; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 14mm;">
        <span>SUNFZENITH — คู่มือสรุประบบฉบับเข้าใจง่ายที่สุด</span>
        <span>หน้าที่ <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
      </div>
    `
  });

  await browser.close();
  console.log('✅ สร้าง PDF ฉบับเข้าใจง่ายสำเร็จแล้ว!');
}

generateEasyPDF().catch((err) => {
  console.error('❌ Error generating easy PDF:', err);
  process.exit(1);
});
