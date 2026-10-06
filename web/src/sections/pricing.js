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
            <span>ขอใบเสนอราคา</span>
          </a>
        </div>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper pricing-section-bg" id="pricing">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <span class="badge-sunny">
            ${SunIcon({ size: 16 })}
            <span>PRICING</span>
          </span>
          <h2 class="section-title">อัตราค่าบริการเริ่มต้น</h2>
          <p class="section-desc">
            ราคาปรับเปลี่ยนได้ตามขอบเขตงานจริง สามารถแจ้งงบประมาณที่คุณสะดวก 
            เพื่อให้เราช่วยแนะนำโซลูชันที่เหมาะสมที่สุดได้เลยครับ
          </p>
        </div>

        <div class="pricing-grid">
          ${tiersHtml}
        </div>
      </div>
    </section>
  `;
}
