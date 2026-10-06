import { PORTFOLIO_DATA } from '../data/portfolio.js';
import { SparkleIcon } from '../components/decor.js';

export function PortfolioSection() {
  const cardsHtml = PORTFOLIO_DATA.map(
    (item) => `
      <div class="card-glass card-interactive portfolio-card reveal-on-scroll" data-category="${item.category}">
        <div class="portfolio-thumb-wrap">
          <img src="${item.image}" alt="${item.title}" class="portfolio-thumb-img" loading="lazy" />
          <span class="portfolio-cat-badge">${item.categoryLabel}</span>
          ${item.isReal ? '<span class="portfolio-live-badge">⚡ Live Project</span>' : ''}
        </div>
        <div class="portfolio-body">
          <h4 class="portfolio-title">${item.title}</h4>
          <p class="portfolio-desc">${item.desc}</p>
          <div class="portfolio-tech-tags">
            ${item.tech.map((t) => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
          ${
            item.demoUrl !== '#'
              ? `<div class="portfolio-link-wrap">
                  <a href="${item.demoUrl}" class="btn btn-secondary btn-sm" ${item.demoUrl.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
                    <span>ดูผลงานจริง</span> <span>→</span>
                  </a>
                 </div>`
              : ''
          }
        </div>
      </div>
    `
  ).join('');

  return `
    <section class="section-wrapper" id="portfolio">
      <div class="container">
        <div class="section-header reveal-on-scroll">
          <span class="badge-sunny">
            ${SparkleIcon({ size: 16 })}
            <span>PORTFOLIO</span>
          </span>
          <h2 class="section-title">ตัวอย่างผลงาน</h2>
          <p class="section-desc">
            ตัวอย่างผลงานที่ผ่านมาและแนวคิดงานสร้างสรรค์ 
            สามารถปรับแต่งและต่อยอดตามสไตล์ที่คุณต้องการได้ทุกรูปแบบ
          </p>
        </div>

        <!-- Category Filters -->
        <div class="portfolio-filter-tabs reveal-on-scroll">
          <button class="filter-tab active" data-filter="all">ทั้งหมด</button>
          <button class="filter-tab" data-filter="website">เว็บไซต์ & แอพ</button>
          <button class="filter-tab" data-filter="coding">โปรแกรม & API</button>
          <button class="filter-tab" data-filter="design">กราฟิก & ดีไซน์</button>
          <button class="filter-tab" data-filter="presentation">สไลด์พรีเซนต์</button>
        </div>

        <div class="portfolio-grid" id="portfolio-grid">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `;
}
