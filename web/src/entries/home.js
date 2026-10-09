document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initPortfolioFilter();
  initDynamicPortfolio();
  initDynamicSiteContent();
  initRateCardModal();
});

// ---------------- 1. Theme Toggle ----------------
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;

  const currentTheme = localStorage.getItem('sunfz_theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sunfz_theme', nextTheme);
  });
}

// ---------------- 2. Mobile Menu ----------------
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-menu');
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      drawer.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close when clicking any menu link
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------------- 3. Scroll Reveal ----------------
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
  } else {
    elements.forEach((el) => el.classList.add('revealed'));
  }
}

// ---------------- 4. Portfolio Filter ----------------
function initPortfolioFilter() {
  const container = document.querySelector('.portfolio-filter-tabs');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = 'true';

  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;

    container.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    const filter = tab.getAttribute('data-filter');
    applyPortfolioFilter(filter);
  });
}

function applyPortfolioFilter(filter) {
  const cards = document.querySelectorAll('.portfolio-card');
  cards.forEach((card) => {
    const cat = card.getAttribute('data-category');
    if (filter === 'all' || cat === filter) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

// ---------------- 4.1 Dynamic Portfolio Loader ----------------
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(rawUrl, fallback = '#') {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) return fallback;
  if (trimmed.startsWith('#')) return /^#[a-zA-Z0-9_\-\u0E00-\u0E7F]*$/.test(trimmed) ? trimmed : fallback;
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    return fallback;
  } catch {
    return fallback;
  }
}

function sanitizeImageUrl(rawUrl, fallback = '/images/placeholder-credit.svg') {
  const safe = sanitizeUrl(rawUrl, fallback);
  return (safe === '#' || !safe) ? fallback : safe;
}

async function initDynamicPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/public/portfolio');
    const data = await res.json();
    if (data.success && Array.isArray(data.portfolio) && data.portfolio.length > 0) {
      grid.innerHTML = data.portfolio.map((item) => {
        const cat = escapeHtml(item.category || 'design');
        const catLabel = escapeHtml(item.categoryLabel || item.category || 'ผลงาน');
        const title = escapeHtml(item.title || '');
        const desc = escapeHtml(item.desc || '');
        const image = escapeHtml(sanitizeImageUrl(item.image));
        const demoUrl = escapeHtml(sanitizeUrl(item.demoUrl || item.image));
        const demoLabel = escapeHtml(item.demoLabel || 'ดูภาพผลงานเต็ม');
        const techList = Array.isArray(item.tech) ? item.tech : (item.tech ? String(item.tech).split(',') : []);

        return `
          <div class="card-glass card-interactive portfolio-card reveal-on-scroll revealed" data-category="${cat}">
            <div class="portfolio-thumb-wrap">
              <img src="${image}" alt="${title}" class="portfolio-thumb-img" loading="lazy" onerror="this.src='/images/placeholder-credit.svg'" />
              <span class="portfolio-cat-badge">${catLabel}</span>
              ${item.isReal !== false ? `<span class="portfolio-live-badge">⚡ Real Project</span>` : ''}
            </div>
            <div class="portfolio-body">
              <h4 class="portfolio-title">${title}</h4>
              <p class="portfolio-desc">${desc}</p>
              <div class="portfolio-tech-tags">
                ${techList.map((t) => `<span class="tech-tag">${escapeHtml(t.trim())}</span>`).join('')}
              </div>
              <div class="portfolio-link-wrap">
                <a href="${demoUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                  <span>${demoLabel}</span> <span>→</span>
                </a>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Respect currently active filter tab
      const activeTab = document.querySelector('.portfolio-filter-tabs .filter-tab.active');
      if (activeTab) {
        applyPortfolioFilter(activeTab.getAttribute('data-filter') || 'all');
      }

      initScrollReveal();
    }
  } catch (err) {
    // If backend fetch fails, keep fallback static HTML
    console.debug('[portfolio] Using fallback static cards:', err);
  }
}

// ---------------- 4.2 Dynamic Site Content (CMS Loader) ----------------
async function initDynamicSiteContent() {
  try {
    const res = await fetch('/api/public/content');
    const data = await res.json();
    if (!data.success || !data.content) return;
    const { general, socials, services, pricing } = data.content;

    // 1. Branding & Hero
    if (general) {
      if (general.shopName) {
        document.querySelectorAll('.brand-name').forEach((el) => {
          el.textContent = general.shopName;
        });
      }
      if (general.tagline) {
        const cleanTagline = general.tagline.includes('—')
          ? general.tagline.split('—')[0].trim()
          : general.tagline.trim();
        document.querySelectorAll('.brand-tagline').forEach((el) => {
          el.textContent = cleanTagline;
        });
      }

      // Announcement Bar
      let annBar = document.getElementById('site-announcement-bar');
      if (general.showAnnouncement && general.announcement) {
        if (!annBar) {
          annBar = document.createElement('div');
          annBar.id = 'site-announcement-bar';
          annBar.className = 'site-announcement-banner';
          document.body.insertBefore(annBar, document.body.firstChild);
        }
        annBar.innerHTML = `<span>${escapeHtml(general.announcement)}</span>`;
        annBar.style.display = 'block';
      } else if (annBar) {
        annBar.remove();
      }

      // Hero Title
      if (general.heroTitleLead || general.heroTitleHighlight1 || general.heroTitleMid || general.heroTitleHighlight2) {
        const heroTitleEl = document.querySelector('.hero-title');
        if (heroTitleEl) {
          heroTitleEl.innerHTML = `
            ${escapeHtml(general.heroTitleLead || 'เปลี่ยน')}<span class="text-highlight-sun">${escapeHtml(general.heroTitleHighlight1 || 'ไอเดียเล็ก ๆ')}</span><br/>
            ${escapeHtml(general.heroTitleMid || 'ให้กลายเป็นผลงานที่')}<br/>
            <span class="text-highlight-sky">${escapeHtml(general.heroTitleHighlight2 || 'ไปได้ไกลกว่าที่คิด ✨')}</span>
          `;
        }
      }

      // Hero Desc
      if (general.heroDesc) {
        const heroDescEl = document.querySelector('.hero-desc');
        if (heroDescEl) heroDescEl.textContent = general.heroDesc;
      }

      // Trust Badges
      const trustItems = document.querySelectorAll('.hero-trust-bar .trust-item');
      if (trustItems[0] && general.trustBadge1Title) {
        const strong = trustItems[0].querySelector('strong');
        const sub = trustItems[0].querySelector('.trust-sub');
        if (strong) strong.textContent = general.trustBadge1Title;
        if (sub && general.trustBadge1Sub) sub.textContent = general.trustBadge1Sub;
      }
      if (trustItems[1] && general.trustBadge2Title) {
        const strong = trustItems[1].querySelector('strong');
        const sub = trustItems[1].querySelector('.trust-sub');
        if (strong) strong.textContent = general.trustBadge2Title;
        if (sub && general.trustBadge2Sub) sub.textContent = general.trustBadge2Sub;
      }

      // Mascot Motto
      if (general.mascotMotto) {
        const mottoEl = document.querySelector('.stage-motto');
        if (mottoEl) mottoEl.textContent = general.mascotMotto;
      }
    }

    // 2. Services Grid
    const servicesGrid = document.querySelector('#services .services-grid');
    if (servicesGrid && Array.isArray(services) && services.length > 0) {
      servicesGrid.innerHTML = services.map((s) => {
        const feats = Array.isArray(s.features) ? s.features : [];
        const tabKey = (s.id === 'slide' || s.id === 'presentation') ? 'slide' : (s.id === 'design' || s.id === 'poster') ? 'poster' : 'web';
        return `
          <div class="card-glass card-interactive service-card reveal-on-scroll revealed">
            <div class="service-card-top">
              <div class="service-icon-box"><span class="service-icon-emoji">${escapeHtml(s.icon || '✨')}</span></div>
              ${s.badge ? `<span class="badge-sky">${escapeHtml(s.badge)}</span>` : ''}
            </div>
            <h3 class="service-card-title">${escapeHtml(s.title || '')}</h3>
            <p class="service-card-desc">${escapeHtml(s.desc || '')}</p>
            ${feats.length > 0 ? `
              <ul class="service-features-list">
                ${feats.map((f) => `<li><span class="check-bullet">✓</span><span>${escapeHtml(f)}</span></li>`).join('')}
              </ul>
            ` : ''}
            <div class="service-card-bottom" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openRateCardModal('${tabKey}')" style="flex: 1 1 auto;">
                <span>🔍 ดูรายละเอียดเรท</span>
              </button>
              <a href="https://line.me/R/ti/p/@419ajynp" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="flex: 1 1 auto; justify-content: center;">
                <span>ปรึกษา (${escapeHtml(s.startingPrice || 'เรทสบายกระเป๋า')})</span> <span>→</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Pricing Grid
    const pricingGrid = document.querySelector('#pricing .pricing-grid');
    if (pricingGrid && Array.isArray(pricing) && pricing.length > 0) {
      pricingGrid.innerHTML = pricing.map((p) => {
        const feats = Array.isArray(p.features) ? p.features : [];
        const isHighlight = Boolean(p.isHighlight);
        const pTabKey = (p.id === 'prc-slide' || p.id === 'slide' || p.id === 'p1' || (p.title && p.title.includes('สไลด์')))
          ? 'slide'
          : (p.id === 'prc-poster' || p.id === 'poster' || p.id === 'p2' || (p.title && p.title.includes('โปสเตอร์')))
          ? 'poster'
          : 'web';
        const rawActionUrl = (p.actionUrl && p.actionUrl !== '#contact') ? p.actionUrl : 'https://line.me/R/ti/p/@419ajynp';
        const targetUrl = sanitizeUrl(rawActionUrl, 'https://line.me/R/ti/p/@419ajynp');
        return `
          <div class="card-glass pricing-card reveal-on-scroll revealed ${isHighlight ? 'pricing-highlight' : ''}">
            <div class="pricing-badge-row">
              <span class="${isHighlight ? 'badge-sunny' : 'badge-sky'}">${escapeHtml(p.badge || 'เรทสบายกระเป๋า')}</span>
            </div>
            <h3 class="pricing-tier-title">${escapeHtml(p.title || '')}</h3>
            <div class="pricing-price-text">${escapeHtml(p.price || '')}</div>
            <p class="pricing-desc">${escapeHtml(p.desc || '')}</p>
            ${feats.length > 0 ? `
              <ul class="pricing-features-list">
                ${feats.map((f) => `<li><span class="pricing-check">✓</span><span>${escapeHtml(f)}</span></li>`).join('')}
              </ul>
            ` : ''}
            <div class="pricing-action" style="display: flex; flex-direction: column; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openRateCardModal('${pTabKey}')" style="width: 100%;">
                <span>🔍 ดูตารางราคาและรายละเอียด</span>
              </button>
              <a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener" class="btn ${isHighlight ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;">
                <span>${escapeHtml(p.actionText || 'ปรึกษาฟรี')}</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Social Links
    if (socials) {
      if (socials.line?.url) {
        const safeLine = sanitizeUrl(socials.line.url);
        if (safeLine !== '#') {
          document.querySelectorAll('a[href*="line.me"]').forEach((a) => {
            a.href = safeLine;
          });
        }
        const lineChannelVal = document.querySelector('.channel-line + .channel-text .channel-val');
        if (lineChannelVal && socials.line.label) {
          lineChannelVal.textContent = socials.line.label;
        }
      }
      if (socials.facebook?.url) {
        const safeFb = sanitizeUrl(socials.facebook.url);
        if (safeFb !== '#') {
          document.querySelectorAll('a[href*="facebook.com"]').forEach((a) => {
            a.href = safeFb;
          });
        }
        const fbChannelVal = document.querySelector('.channel-fb + .channel-text .channel-val');
        if (fbChannelVal && socials.facebook.label) {
          fbChannelVal.textContent = socials.facebook.label;
        }
      }
    }
  } catch (err) {
    console.debug('[cms] Using fallback static site content:', err);
  }
}

// ---------------- 6. Rate Card Details Modal ----------------
function initRateCardModal() {
  const modal = document.getElementById('rate-card-modal');
  if (!modal) return;

  // Tab buttons
  modal.querySelectorAll('.rate-card-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      switchRateCardTab(targetId);
    });
  });

  // Close when clicking outside modal box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeRateCardModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeRateCardModal();
    }
  });
}

window.openRateCardModal = function (tabKey = 'all') {
  const modal = document.getElementById('rate-card-modal');
  if (!modal) return;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const tabMapping = {
    web: 'rc-web',
    website: 'rc-web',
    coding: 'rc-web',
    slide: 'rc-slide',
    slides: 'rc-slide',
    presentation: 'rc-slide',
    poster: 'rc-poster',
    posters: 'rc-poster',
    design: 'rc-poster',
    checklist: 'rc-checklist',
    evaluation: 'rc-checklist',
    terms: 'rc-terms',
    about: 'rc-terms',
    all: 'rc-web'
  };

  const targetPaneId = tabMapping[tabKey] || 'rc-web';
  switchRateCardTab(targetPaneId);
};

window.closeRateCardModal = function () {
  const modal = document.getElementById('rate-card-modal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

function switchRateCardTab(targetPaneId) {
  const modal = document.getElementById('rate-card-modal');
  if (!modal) return;

  modal.querySelectorAll('.rate-card-tab-btn').forEach((b) => {
    if (b.getAttribute('data-target') === targetPaneId) {
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
    } else {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    }
  });

  modal.querySelectorAll('.rate-card-tab-pane').forEach((p) => {
    if (p.id === targetPaneId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

// Toast notification helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✨' : '⚠️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
