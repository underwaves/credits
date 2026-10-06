import { StarIcon, SparkleIcon, SunIcon, CloudIcon } from '../components/decor.js';
import { MascotZenny } from '../components/mascot.js';

export function HeroSection() {
  return `
    <section class="hero-section" id="hero">
      <!-- Background Floating Clouds & Stars -->
      <div class="hero-decor-clouds" aria-hidden="true">
        <div class="decor-cloud decor-cloud-1 anim-drift">${CloudIcon({ size: 90 })}</div>
        <div class="decor-cloud decor-cloud-2 anim-drift anim-delay-2">${CloudIcon({ size: 70 })}</div>
        <div class="decor-star decor-star-1 anim-twinkle">${StarIcon({ size: 28 })}</div>
        <div class="decor-star decor-star-2 anim-twinkle anim-delay-1">${SparkleIcon({ size: 22 })}</div>
        <div class="decor-star decor-star-3 anim-twinkle anim-delay-3">${StarIcon({ size: 20 })}</div>
      </div>

      <div class="container hero-container">
        <!-- Left Text Column -->
        <div class="hero-text-col">
          <div class="hero-badge-wrap anim-float-gentle">
            <span class="badge-sunny">
              ${SunIcon({ size: 18 })}
              <span>Small Dream, Big Zenith</span>
            </span>
          </div>

          <h1 class="hero-title">
            เปลี่ยน<span class="text-highlight-sun">ไอเดียเล็ก ๆ</span><br/>
            ให้กลายเป็นผลงานที่<br/>
            <span class="text-highlight-sky">ไปได้ไกลกว่าที่คิด</span> ✨
          </h1>

          <p class="hero-desc">
            ยินดีต้อนรับสู่ <strong>SUNFZENITH</strong> สตูดิโอเล็ก ๆ ที่ตั้งใจทำงานคุณภาพ 
            รับทำเว็บไซต์, ดูแลงานเขียนโปรแกรม, ออกแบบกราฟิก และสไลด์พรีเซนต์ 
            ในราคานักศึกษาสบายกระเป๋า คุยง่าย เป็นกันเอง พร้อมส่งต่อผลงานที่ดีที่สุดให้คุณ
          </p>

          <div class="hero-cta-group">
            <a href="#contact" class="btn btn-primary btn-lg">
              <span>เริ่มต้นพูดคุย</span>
              <span class="cta-arrow">→</span>
            </a>
            <a href="#services" class="btn btn-secondary btn-lg">
              <span>ดูบริการของเรา</span>
            </a>
          </div>

          <!-- Trust Badges -->
          <div class="hero-trust-bar">
            <div class="trust-item">
              <span class="trust-icon">💛</span>
              <div>
                <strong>คุยง่าย ราคานักศึกษา</strong>
                <span class="trust-sub">งบประมาณปรับได้ตามต้องการ</span>
              </div>
            </div>
            <div class="trust-item">
              <span class="trust-icon">🛡️</span>
              <div>
                <strong>ตรวจสอบเครดิตได้ 100%</strong>
                <span class="trust-sub">มีรีวิวและหลักฐานจริงทุกรายการ</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Visual Showcase Column -->
        <div class="hero-visual-col">
          <div class="hero-character-stage anim-float">
            <!-- Decorative Sun Background Glow -->
            <div class="stage-glow-disc"></div>
            
            <!-- Reference Inspired Avatar Card -->
            <div class="stage-main-card">
              <div class="stage-avatar-circle">
                <img src="/images/brand-mascot.jpg" alt="SUNFZENITH Official Character" class="stage-avatar-img" />
              </div>
              <div class="stage-card-caption">
                <span class="stage-tag">🌤️ Official Mascot</span>
                <span class="stage-brand-label">SUNFZENITH</span>
                <p class="stage-motto">“เล็กแต่ตั้งใจ ทำด้วยหัวใจทุกชิ้น”</p>
              </div>
            </div>

            <!-- Floating Badge Widget 1: Happy Rating -->
            <div class="floating-widget widget-rating anim-float-gentle anim-delay-1">
              <span class="widget-emoji">⭐</span>
              <div>
                <strong>5.0 / 5.0 Rating</strong>
                <span>รีวิวแท้จากลูกค้าจริง</span>
              </div>
            </div>

            <!-- Floating Badge Widget 2: Ready to Code -->
            <div class="floating-widget widget-tech anim-float-gentle anim-delay-2">
              <span class="widget-emoji">💻</span>
              <div>
                <strong>Digital & Tech Studio</strong>
                <span>Web App • Code • Design</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
