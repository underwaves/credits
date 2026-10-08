import { validateContact } from '@shared/validation.js';

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initScrollReveal();
  initPortfolioFilter();
  initDynamicPortfolio();
  initDynamicSiteContent();
  initContactForm();
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
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
        const image = escapeHtml(item.image || '/images/placeholder-credit.svg');
        const demoUrl = escapeHtml(item.demoUrl || item.image || '#');
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
        document.querySelectorAll('.brand-tagline').forEach((el) => {
          el.textContent = general.tagline;
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
        annBar.style.display = 'none';
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
            <div class="service-card-bottom">
              <a href="#contact" class="btn btn-secondary btn-sm" onclick="selectServiceOption('${escapeHtml(s.id)}')">
                <span>ปรึกษาบริการนี้ (${escapeHtml(s.startingPrice || 'เรทสบายกระเป๋า')})</span> <span>→</span>
              </a>
            </div>
          </div>
        `;
      }).join('');

      // Also update select options in contact form
      const cfServiceSelect = document.getElementById('cf-service');
      if (cfServiceSelect) {
        const currentVal = cfServiceSelect.value;
        cfServiceSelect.innerHTML = services.map((s) => `
          <option value="${escapeHtml(s.id)}">${escapeHtml(s.title)} (${escapeHtml(s.startingPrice || '')})</option>
        `).join('') + '<option value="other">อื่น ๆ / ยังไม่แน่ใจ</option>';
        if (currentVal) cfServiceSelect.value = currentVal;
      }
    }

    // 3. Pricing Grid
    const pricingGrid = document.querySelector('#pricing .pricing-grid');
    if (pricingGrid && Array.isArray(pricing) && pricing.length > 0) {
      pricingGrid.innerHTML = pricing.map((p) => {
        const feats = Array.isArray(p.features) ? p.features : [];
        const isHighlight = Boolean(p.isHighlight);
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
            <div class="pricing-action">
              <a href="${escapeHtml(p.actionUrl || '#contact')}" class="btn ${isHighlight ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;">
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
        document.querySelectorAll('a[href*="line.me"]').forEach((a) => {
          a.href = socials.line.url;
        });
        const lineChannelVal = document.querySelector('.channel-line + .channel-text .channel-val');
        if (lineChannelVal && socials.line.label) {
          lineChannelVal.textContent = socials.line.label;
        }
      }
      if (socials.facebook?.url) {
        document.querySelectorAll('a[href*="facebook.com"]').forEach((a) => {
          a.href = socials.facebook.url;
        });
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

// Quick helper to select service from service card
window.selectServiceOption = function (serviceId) {
  const selectEl = document.getElementById('cf-service');
  if (selectEl) {
    selectEl.value = serviceId;
  }
};

// ---------------- 5. Contact Form ----------------
const formStartTime = Date.now();

function initContactForm() {
  const channelSelect = document.getElementById('cf-channel');
  if (channelSelect) {
    channelSelect.addEventListener('change', updateContactPlaceholder);
  }
}

window.updateContactPlaceholder = function () {
  const channelSelect = document.getElementById('cf-channel');
  const inputEl = document.getElementById('cf-contact');
  if (!channelSelect || !inputEl) return;

  const placeholders = {
    line: 'เช่น sunny.dream หรือ @lineid',
    facebook: 'เช่น ชื่อโปรไฟล์ หรือ ลิงก์เฟซบุ๊ก',
    email: 'เช่น you@example.com',
    phone: 'เช่น 08x-xxx-xxxx'
  };

  inputEl.placeholder = placeholders[channelSelect.value] || 'กรอกข้อมูลติดต่อ';
};

let isSubmittingContact = false;

window.handleContactSubmit = async function (e) {
  e.preventDefault();
  if (isSubmittingContact) return;

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('btn-submit-contact');
  const submitText = document.getElementById('btn-contact-text');
  const alertBox = document.getElementById('contact-alert');

  // Clear previous errors
  document.querySelectorAll('.form-error-msg').forEach((el) => (el.textContent = ''));
  if (alertBox) {
    alertBox.style.display = 'none';
    alertBox.className = 'contact-alert-box';
  }

  const formData = {
    name: document.getElementById('cf-name')?.value?.trim(),
    contactChannel: document.getElementById('cf-channel')?.value,
    contactValue: document.getElementById('cf-contact')?.value?.trim(),
    service: document.getElementById('cf-service')?.value,
    budget: document.getElementById('cf-budget')?.value,
    details: document.getElementById('cf-details')?.value?.trim(),
    website: document.getElementById('cf-website')?.value,
    elapsedMs: Date.now() - formStartTime
  };

  // Client-side validation
  const validation = validateContact(formData);
  if (!validation.ok) {
    for (const [field, msg] of Object.entries(validation.errors)) {
      const errEl = document.getElementById(`err-${field}`);
      if (errEl) errEl.textContent = msg;
    }
    showToast('กรุณากรอกข้อมูลในฟอร์มให้ครบถ้วนถูกต้อง', 'error');
    return;
  }

  isSubmittingContact = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    if (submitText) submitText.textContent = 'กำลังส่งข้อความ... กรุณารอสักครู่ ✨';
  }

  try {
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (data.success) {
      if (alertBox) {
        alertBox.className = 'contact-alert-box success';
        alertBox.textContent = data.message || 'ส่งข้อความเรียบร้อยแล้ว!';
        alertBox.style.display = 'block';
      }
      showToast('ส่งข้อความสำเร็จแล้ว! เราจะติดต่อกลับโดยเร็วที่สุดครับ', 'success');
      form.reset();
    } else {
      if (alertBox) {
        alertBox.className = 'contact-alert-box error';
        alertBox.textContent = data.message || 'เกิดข้อผิดพลาดในการส่งข้อความ';
        alertBox.style.display = 'block';
      }
      showToast(data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    }
  } catch (err) {
    console.error('Contact submit error:', err);
    if (alertBox) {
      alertBox.className = 'contact-alert-box error';
      alertBox.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาทักทาง LINE: luvxawrnrkc ได้โดยตรงครับ';
      alertBox.style.display = 'block';
    }
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง', 'error');
  } finally {
    isSubmittingContact = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      if (submitText) submitText.textContent = 'ส่งข้อความหาเรา ✨';
    }
  }
};

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
