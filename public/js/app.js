// ========================================================
// SUNFZ - Public Credit & Reviews Viewer
// Strictly Customer-Facing (Zero Admin Controls)
// ========================================================

const state = {
  credits: [],
  settings: {},
  searchQuery: '',
  lightbox: {
    credit: null,
    currentImageIndex: 0
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await fetchSettings();
  await fetchCredits();
  
  // Check deep-link ?credit=id
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const creditIdParam = urlParams.get('credit');
    if (creditIdParam) {
      openLightbox(creditIdParam);
    }
  } catch (e) {}

  updateIcons();
});

// Helper to refresh Lucide icons
function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Show Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-rose-950 border-rose-600/50 text-rose-200' : 'bg-slate-900 border-amber-500/50 text-slate-100';
  const icon = type === 'error' ? 'alert-circle' : 'check-circle-2';

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  updateIcons();

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch public settings
async function fetchSettings() {
  try {
    const res = await fetch('/api/public/settings');
    const data = await res.json();
    if (data.success) {
      state.settings = data.settings || {};
      renderSettings();
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Fetch credits
async function fetchCredits() {
  const loading = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const grid = document.getElementById('credits-grid');

  if (loading) loading.classList.remove('hidden');
  if (empty) empty.classList.add('hidden');
  if (grid) grid.innerHTML = '';

  try {
    const params = new URLSearchParams();
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }

    const res = await fetch(`/api/public/credits?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      state.credits = data.credits || [];
      renderCreditsGrid();
    }
  } catch (err) {
    console.error('Error fetching credits:', err);
    showToast('เกิดข้อผิดพลาดในการโหลดรายการเครดิต', 'error');
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

// Helper to format relative time
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'เมื่อสักครู่';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 5) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    if (diffHour < 24) return `${diffHour} ชม. ที่แล้ว`;
    if (diffDay === 1) return 'เมื่อวานนี้';
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// Render settings
function renderSettings() {
  const { shopName, tagline, announcement, socials } = state.settings;

  const currentShop = shopName || 'sunfz';
  document.title = `${currentShop} - รวมเครดิตการซื้อขาย`;
  
  const navName = document.getElementById('nav-shop-name');
  const footerName = document.getElementById('footer-shop-name');
  if (navName) navName.textContent = currentShop;
  if (footerName) footerName.textContent = currentShop;

  if (tagline) {
    const heroTag = document.getElementById('hero-tagline');
    if (heroTag) heroTag.textContent = tagline;
  }

  if (announcement) {
    const annText = document.getElementById('announcement-text');
    if (annText) annText.textContent = announcement;
  }

  const headerTotal = document.getElementById('header-total-count');
  if (headerTotal) headerTotal.textContent = state.credits.length;

  // Social Links
  const socialContainer = document.getElementById('social-links-container');
  if (socialContainer && socials) {
    let html = '';
    if (socials.line && socials.line.enabled && socials.line.url) {
      html += `
        <a href="${socials.line.url}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-500"></i>
          <span>${socials.line.label || 'LINE'}</span>
        </a>
      `;
    }
    if (socials.facebook && socials.facebook.enabled && socials.facebook.url) {
      html += `
        <a href="${socials.facebook.url}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
          <i data-lucide="facebook" class="w-3.5 h-3.5 text-blue-500"></i>
          <span>${socials.facebook.label || 'Facebook'}</span>
        </a>
      `;
    }
    if (socials.discord && socials.discord.enabled && socials.discord.url) {
      html += `
        <a href="${socials.discord.url}" target="_blank" rel="noopener" class="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-sm transition">
          <i data-lucide="disc" class="w-3.5 h-3.5 text-indigo-500"></i>
          <span>${socials.discord.label || 'Discord'}</span>
        </a>
      `;
    }
    socialContainer.innerHTML = html;
  }
}

// Render credits cards grid (Simple, Clean, Photo-First)
function renderCreditsGrid() {
  const grid = document.getElementById('credits-grid');
  const empty = document.getElementById('empty-state');
  const countLabel = document.getElementById('result-count-label');
  const headerTotal = document.getElementById('header-total-count');

  if (countLabel) countLabel.textContent = `${state.credits.length} รายการ`;
  if (headerTotal) headerTotal.textContent = state.credits.length;

  if (!state.credits || state.credits.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  grid.innerHTML = state.credits.map(credit => {
    const mainImage = (credit.images && credit.images.length > 0) ? credit.images[0] : '/images/placeholder-credit.svg';
    const imageCount = credit.images ? credit.images.length : 1;
    const formattedPrice = credit.price ? `฿${Number(credit.price).toLocaleString('th-TH')}` : '';
    const displayTime = formatRelativeTime(credit.date || credit.createdAt);
    const customerName = credit.customer ? escapeHtml(credit.customer) : 'ลูกค้า';

    return `
      <div class="clean-card overflow-hidden flex flex-col justify-between group">
        
        <!-- Big Proof Image (Clickable to Lightbox) -->
        <div 
          onclick="openLightbox('${credit.id}')"
          class="relative w-full h-64 sm:h-72 bg-slate-100 cursor-pointer overflow-hidden"
        >
          <img 
            src="${mainImage}" 
            alt="${escapeHtml(credit.title)}" 
            class="w-full h-full object-cover zoomable-thumb" 
            loading="lazy" 
            onerror="this.src='/images/placeholder-credit.svg'"
          >
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 transition px-3 py-1.5 bg-white/95 text-slate-800 text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5">
              <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-amber-500"></i> คลิกดูรูปเต็ม
            </span>
          </div>

          ${credit.isPinned ? `
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
              <i data-lucide="star" class="w-3.5 h-3.5 fill-white text-white"></i> ปักหมุด
            </span>
          ` : ''}

          ${imageCount > 1 ? `
            <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold backdrop-blur-sm">
              ${imageCount} รูป
            </span>
          ` : ''}
        </div>

        <!-- Information details -->
        <div class="p-4 flex-grow flex flex-col justify-between bg-white">
          <div>
            <!-- Item Title -->
            <h3 class="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5 group-hover:text-amber-600 transition-colors">
              ${escapeHtml(credit.title)}
            </h3>

            <!-- Review / Note snippet if exists -->
            ${credit.description ? `
              <p class="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                "${escapeHtml(credit.description)}"
              </p>
            ` : ''}
          </div>

          <!-- Footer of Card: Customer, Date, Price -->
          <div>
            <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div class="flex items-center gap-1.5 truncate">
                <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                <span class="font-semibold text-slate-800 truncate">${customerName}</span>
                <span class="text-slate-300">•</span>
                <span class="text-slate-400 text-[11px] shrink-0">${displayTime}</span>
              </div>

              ${formattedPrice ? `
                <div class="font-heading font-black text-base text-slate-900 shrink-0 ml-2">
                  ${formattedPrice}
                </div>
              ` : ''}
            </div>
          </div>

        </div>

      </div>
    `;
  }).join('');

  updateIcons();
}

// Search handling
let searchTimeout = null;
function handleSearchInput(e) {
  const val = e.target.value;
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    if (val) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchQuery = val;
    fetchCredits();
  }, 300);
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');
  state.searchQuery = '';
  fetchCredits();
}

// Lightbox Modal
function openLightbox(creditId) {
  const credit = state.credits.find(c => c.id === creditId);
  if (!credit) return;

  state.lightbox.credit = credit;
  state.lightbox.currentImageIndex = 0;

  const modal = document.getElementById('lightbox-modal');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-description');
  const price = document.getElementById('lightbox-price');
  const customer = document.getElementById('lightbox-customer');
  const date = document.getElementById('lightbox-date');

  if (title) title.textContent = credit.title;
  if (desc) desc.textContent = credit.description || 'ไม่มีคำอธิบายเพิ่มเติม';
  if (price) price.textContent = credit.price ? `฿${Number(credit.price).toLocaleString('th-TH')}` : '';
  if (customer) customer.textContent = credit.customer || 'ลูกค้าไม่ระบุชื่อ';
  if (date) date.textContent = credit.date || '-';

  updateLightboxImage();
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Deep-link URL sync
  try {
    const url = new URL(window.location);
    url.searchParams.set('credit', creditId);
    window.history.replaceState({}, '', url);
  } catch (e) {}

  updateIcons();
}

function updateLightboxImage() {
  const credit = state.lightbox.credit;
  if (!credit || !credit.images || credit.images.length === 0) return;

  const currentIdx = state.lightbox.currentImageIndex;
  const currentSrc = credit.images[currentIdx] || '/images/placeholder-credit.svg';

  const imgEl = document.getElementById('lightbox-img');
  const openExt = document.getElementById('lightbox-open-external');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');
  const thumbStrip = document.getElementById('lightbox-thumbnails');

  if (imgEl) {
    imgEl.src = currentSrc;
    imgEl.style.transform = 'scale(1)';
  }
  if (openExt) openExt.href = currentSrc;

  // Multiple images navigation
  if (credit.images.length > 1) {
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');

    if (thumbStrip) {
      thumbStrip.classList.remove('hidden');
      thumbStrip.innerHTML = credit.images.map((img, i) => `
        <img 
          src="${img}" 
          onclick="setLightboxImageIndex(${i})"
          class="w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition ${i === currentIdx ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}"
        >
      `).join('');
    }
  } else {
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (thumbStrip) thumbStrip.classList.add('hidden');
  }
}

function prevLightboxImage() {
  const images = state.lightbox.credit?.images || [];
  if (images.length <= 1) return;
  state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex - 1 + images.length) % images.length;
  updateLightboxImage();
}

function nextLightboxImage() {
  const images = state.lightbox.credit?.images || [];
  if (images.length <= 1) return;
  state.lightbox.currentImageIndex = (state.lightbox.currentImageIndex + 1) % images.length;
  updateLightboxImage();
}

function setLightboxImageIndex(idx) {
  state.lightbox.currentImageIndex = idx;
  updateLightboxImage();
}

function toggleZoomImage(el) {
  if (el.style.transform === 'scale(1.6)') {
    el.style.transform = 'scale(1)';
    el.style.cursor = 'zoom-in';
  } else {
    el.style.transform = 'scale(1.6)';
    el.style.cursor = 'zoom-out';
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  try {
    const url = new URL(window.location);
    url.searchParams.delete('credit');
    window.history.replaceState({}, '', url);
  } catch (e) {}
}

function copyCreditLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('คัดลอกลิงก์เครดิตนี้แล้ว! นำไปส่งให้ลูกค้าดูได้ทันที');
    }).catch(() => {
      prompt('คัดลอกลิงก์เครดิตนี้:', url);
    });
  } else {
    prompt('คัดลอกลิงก์เครดิตนี้:', url);
  }
}

// Close modals on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowLeft') {
    prevLightboxImage();
  } else if (e.key === 'ArrowRight') {
    nextLightboxImage();
  }
});

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
