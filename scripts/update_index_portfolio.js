import fs from 'node:fs';

const portfolio = JSON.parse(fs.readFileSync('src/server/data/portfolio.json', 'utf8'));

const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const cardsHtml = portfolio.map((item) => {
  const cat = escapeHtml(item.category || 'design');
  const catLabel = escapeHtml(item.categoryLabel || 'ผลงาน');
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.desc);
  const image = escapeHtml(item.image);
  const demoUrl = escapeHtml(item.demoUrl || item.image);
  const demoLabel = escapeHtml(item.demoLabel || 'ดูภาพผลงานเต็ม');
  const tech = item.tech || [];
  const isImage = demoUrl.match(/\.(png|webp|jpg|jpeg|svg)$/i);

  return `          <!-- Card: ${title} -->
          <div class="card-glass card-interactive portfolio-card reveal-on-scroll" data-category="${cat}">
            <div class="portfolio-thumb-wrap">
              <img src="${image}" alt="${title}" class="portfolio-thumb-img" loading="lazy" />
              <span class="portfolio-cat-badge">${catLabel}</span>
              ${item.isReal !== false ? '<span class="portfolio-live-badge">⚡ Real Project</span>' : ''}
            </div>
            <div class="portfolio-body">
              <h4 class="portfolio-title">${title}</h4>
              <p class="portfolio-desc">${desc}</p>
              <div class="portfolio-tech-tags">
                ${tech.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
              </div>
              <div class="portfolio-link-wrap">
                <a href="${demoUrl}" class="btn btn-secondary btn-sm" ${demoUrl.startsWith('http') || isImage ? 'target="_blank" rel="noopener"' : ''}>
                  <span>${demoLabel}</span> <span>→</span>
                </a>
              </div>
            </div>
          </div>`;
}).join('\n\n');

// Read web/index.html
let indexHtml = fs.readFileSync('web/index.html', 'utf8');

// Replace content between <div class="portfolio-grid" id="portfolio-grid"> and </div>
const startMarker = '<div class="portfolio-grid" id="portfolio-grid">';
const startIndex = indexHtml.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find portfolio-grid in web/index.html');
  process.exit(1);
}

const afterStart = startIndex + startMarker.length;
// Find closing </div> for portfolio-grid
// Since cards are nested <div>, let's look for </section> after portfolio-grid or closing </div>
const endMarker = '</div>\n      </div>\n    </section>';
const endIndex = indexHtml.indexOf(endMarker, afterStart);
if (endIndex === -1) {
  console.error('Could not find endMarker in web/index.html');
  process.exit(1);
}

const newIndexHtml = indexHtml.substring(0, afterStart) + '\n' + cardsHtml + '\n        ' + indexHtml.substring(endIndex);

fs.writeFileSync('web/index.html', newIndexHtml, 'utf8');
console.log('Successfully updated web/index.html with all', portfolio.length, 'portfolio cards!');
