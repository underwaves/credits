import { SERVICES_DATA } from '../data/services.js';
import { SunIcon } from '../components/decor.js';

export function ServicesSection() {
  const cardsHtml = SERVICES_DATA.map(
    (service) => `
      <div class="card-glass card-interactive service-card reveal-on-scroll">
        <div class="service-card-top">
          <div class="service-icon-box">
            <span class="service-icon-emoji">${service.icon}</span>
          </div>
          <span class="badge-sky">${service.tag}</span>
        </div>

        <h3 class="service-card-title">${service.title}</h3>
        <p class="service-card-desc">${service.shortDesc}</p>

        <ul class="service-features-list">
          ${service.features
            .map(
              (f) => `
            <li>
              <span class="check-bullet">✓</span>
              <span>${f}</span>
            </li>
          `
            )
            .join('')}
        </ul>

        <div class="service-card-bottom">
          <a href="#contact" class="btn btn-secondary btn-sm" onclick="selectServiceOption('${service.id}')">
            <span>ปรึกษาบริการนี้</span>
            <span>→</span>
          </a>
        </div>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper" id="services">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
            <span class="badge-sunny">
              ${SunIcon({ size: 16 })}
              <span>SERVICES</span>
            </span>
            <span class="badge-sky">
              <span>💬 ปรึกษาฟรี ไม่มีค่าใช้จ่าย</span>
            </span>
          </div>
          <h2 class="section-title">บริการของเรา</h2>
          <p class="section-desc">
            บริการทำเว็บไซต์ Web App และงานออกแบบสื่อ สไลด์ โปสเตอร์ อินโฟกราฟิก 
            เหมาะสำหรับนักศึกษา ร้านค้าเล็ก ๆ และทุกคนที่ต้องการงานคุณภาพในงบประหยัด คุยง่ายเป็นกันเอง
          </p>
        </div>

        <div class="services-grid">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `;
}
