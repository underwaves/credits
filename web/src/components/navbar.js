export function Navbar() {
  return `
    <header class="navbar-wrapper" id="site-navbar">
      <div class="container navbar-inner">
        <!-- Brand Logo -->
        <a href="/" class="brand-link" aria-label="SUNFZENITH หน้าแรก">
          <div class="brand-logo-wrap anim-sun-glow">
            <img src="/images/mascot-logo.png" alt="SUNFZENITH" class="brand-avatar-img" width="44" height="44" />
          </div>
          <div class="brand-info">
            <span class="brand-name">SUNFZENITH</span>
            <span class="brand-tagline">Small Dream, Big Zenith</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-links" aria-label="เมนูหลัก">
          <a href="/#services" class="nav-item">บริการ</a>
          <a href="/#why" class="nav-item">จุดเด่น</a>
          <a href="/#process" class="nav-item">ขั้นตอน</a>
          <a href="/#portfolio" class="nav-item">ผลงาน</a>
          <a href="/#pricing" class="nav-item">ราคา</a>
          <a href="/credits" class="nav-item nav-badge-item">
            <span>เครดิตร้าน</span>
            <span class="nav-badge">รีวิวแท้</span>
          </a>
          <a href="/#contact" class="nav-item">ติดต่อเรา</a>
        </nav>

        <!-- Right Actions -->
        <div class="nav-actions">
          <!-- Dark Mode Toggle Button -->
          <button id="theme-toggle-btn" class="theme-toggle" aria-label="สลับโหมดมืด/สว่าง" title="สลับโหมดมืด/สว่าง">
            <span class="theme-icon-sun">☀️</span>
            <span class="theme-icon-moon">🌙</span>
          </button>

          <!-- Primary CTA Button -->
          <a href="/#contact" class="btn btn-primary btn-sm nav-cta-btn">
            <span>เริ่มต้นพูดคุย</span>
            <span class="cta-arrow">→</span>
          </a>

          <!-- Mobile Menu Trigger -->
          <button id="mobile-menu-btn" class="mobile-toggle" aria-label="เปิดเมนูมือถือ" aria-expanded="false">
            <span class="bar bar-1"></span>
            <span class="bar bar-2"></span>
            <span class="bar bar-3"></span>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="mobile-menu-drawer" aria-hidden="true">
        <div class="mobile-nav-list">
          <a href="/#services" class="mobile-nav-link">🌐 บริการของเรา</a>
          <a href="/#why" class="mobile-nav-link">⭐ จุดเด่น SUNFZENITH</a>
          <a href="/#process" class="mobile-nav-link">🌈 ขั้นตอนการทำงาน</a>
          <a href="/#portfolio" class="mobile-nav-link">💼 ตัวอย่างผลงาน</a>
          <a href="/#pricing" class="mobile-nav-link">💰 อัตราค่าบริการ</a>
          <a href="/credits" class="mobile-nav-link">👍 สมุดเครดิต & รีวิวร้าน</a>
          <a href="/#contact" class="mobile-nav-link">💬 ติดต่อประเมินราคา</a>
          <div class="mobile-cta-wrap">
            <a href="/#contact" class="btn btn-primary btn-lg" style="width: 100%;">
              เริ่มต้นโปรเจกต์กับเรา ✨
            </a>
          </div>
        </div>
      </div>
    </header>
  `;
}
