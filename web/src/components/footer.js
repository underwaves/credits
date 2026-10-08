export function Footer() {
  const currentYear = new Date().getFullYear();

  return `
    <footer class="footer-wrapper">
      <div class="container footer-content">
        <div class="footer-brand-col">
          <div class="footer-brand-header">
            <div class="footer-avatar-wrap anim-sun-glow">
              <span class="brand-sun-emoji">☀️</span>
            </div>
            <div>
              <span class="footer-brand-title">SUNFZENITH</span>
              <span class="footer-brand-subtitle">Small Dream, Big Zenith</span>
            </div>
          </div>
          <p class="footer-brand-desc">
            สตูดิโอสร้างสรรค์งานดิจิทัล เว็บไซต์ และงานกราฟิกดีไซน์<br/>
            เปลี่ยนทุกไอเดียเล็ก ๆ ให้กลายเป็นผลงานจริงที่คุณภาคภูมิใจ
          </p>
          <div class="footer-social-links">
            <a href="https://line.me/R/ti/p/@419ajynp" target="_blank" rel="noopener" class="social-chip" title="LINE OA: @419ajynp">
              <span>💬</span> LINE: @419ajynp
            </a>
            <a href="https://www.facebook.com/profile.php?id=61595346770633&locale=th_TH" target="_blank" rel="noopener" class="social-chip" title="Facebook Page">
              <span>📘</span> Facebook
            </a>
          </div>
        </div>

        <div class="footer-links-col">
          <h4 class="footer-col-title">บริการหลัก</h4>
          <ul class="footer-nav-list">
            <li><a href="/#services">Website & Landing Page</a></li>
            <li><a href="/#services">Web App & ระบบหลังบ้าน</a></li>
            <li><a href="/#services">สไลด์พรีเซนต์ & รายงาน</a></li>
            <li><a href="/#services">โปสเตอร์ & อินโฟกราฟิก</a></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h4 class="footer-col-title">ลิงก์ด่วน</h4>
          <ul class="footer-nav-list">
            <li><a href="/credits">สมุดรวมเครดิตการซื้อขาย (รีวิวแท้)</a></li>
            <li><a href="/#process">ขั้นตอนการร่วมงาน</a></li>
            <li><a href="/#portfolio">ตัวอย่างผลงาน</a></li>
            <li><a href="/#pricing">ประเมินราคาเริ่มต้น</a></li>
            <li><a href="/admin">เข้าสู่ระบบแอดมิน</a></li>
          </ul>
        </div>
      </div>

      <div class="container footer-bottom">
        <p>&copy; ${currentYear} SUNFZENITH. All rights reserved. Made with sunshine & care ☀️✨</p>
        <p class="footer-disclaimer">ปลอดภัย มีหลักฐานทุกรายการ ตรวจสอบเครดิตได้ 100%</p>
      </div>
    </footer>
  `;
}
