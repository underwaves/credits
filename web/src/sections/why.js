import { WHY_US_DATA } from '../data/features.js';
import { StarIcon } from '../components/decor.js';

export function WhySection() {
  const cardsHtml = WHY_US_DATA.map(
    (item, index) => `
      <div class="card-glass card-interactive why-card reveal-on-scroll anim-delay-${(index % 3) + 1}">
        <div class="why-icon-bubble">
          <span>${item.icon}</span>
        </div>
        <h3 class="why-card-title">${item.title}</h3>
        <p class="why-card-desc">${item.desc}</p>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper why-section-bg" id="why">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <span class="badge-sunny">
            ${StarIcon({ size: 16 })}
            <span>WHY SUNFZENITH</span>
          </span>
          <h2 class="section-title">ทำไมถึงเลือก SUNFZENITH?</h2>
          <p class="section-desc">
            เราเข้าใจทั้งมุมมองของผู้สั่งงาน และมาตรฐานงานดิจิทัลยุคใหม่ 
            มุ่งเน้นการส่งมอบงานคุณภาพที่คุ้มค่าและสร้างรอยยิ้ม
          </p>
        </div>

        <div class="why-grid">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `;
}
