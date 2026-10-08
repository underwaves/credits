import { PRICING_DATA } from '../data/pricing.js';
import { SunIcon } from '../components/decor.js';

export function PricingSection() {
  const tiersHtml = PRICING_DATA.map(
    (tier) => `
      <div class="card-glass pricing-card ${tier.highlight ? 'pricing-highlight' : ''} reveal-on-scroll">
        <div class="pricing-badge-row">
          <span class="${tier.highlight ? 'badge-sunny' : 'badge-sky'}">${tier.badge}</span>
        </div>

        <h3 class="pricing-tier-title">${tier.title}</h3>
        <div class="pricing-price-text">${tier.priceText}</div>
        <p class="pricing-desc">${tier.desc}</p>

        <ul class="pricing-features-list">
          ${tier.features
            .map(
              (f) => `
            <li>
              <span class="pricing-check">✓</span>
              <span>${f}</span>
            </li>
          `
            )
            .join('')}
        </ul>

        <div class="pricing-action">
          <a href="#contact" class="btn ${tier.highlight ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;">
            <span>${tier.ctaText || 'ปรึกษาฟรี'}</span>
          </a>
        </div>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper pricing-section-bg" id="pricing">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;">
            <span class="badge-sunny">
              ${SunIcon({ size: 16 })}
              <span>PRICING</span>
            </span>
            <span class="badge-sky">
              <span>✨ ปรึกษาฟรี 100% ไม่มีค่าใช้จ่าย</span>
            </span>
          </div>
          <h2 class="section-title">ราคาเป็นกันเอง สบายกระเป๋า ประเมินชัดเจน</h2>
          <p class="section-desc">
            งานสไลด์และโปสเตอร์เริ่มต้นเพียง 49 บาท งานเว็บไซต์และ Landing Page เริ่มต้น 149 บาท 
            ประเมินตามขอบเขตงานจริง ปรึกษารายละเอียดก่อนได้ฟรี คุยง่ายเป็นกันเองครับ ✨
          </p>
        </div>

        <div class="pricing-grid">
          ${tiersHtml}
        </div>
      </div>
    </section>
  `;
}
